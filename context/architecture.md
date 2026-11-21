# Architecture Context

## Stack

| Layer        | Technology                                         | Role |
| ------------ | -------------------------------------------------- | ---- |
| Framework    | Next.js (App Router) + TypeScript                  | Single app for public landing/checkout, creator dashboard, and admin dashboard; Route Handlers own mutations |
| UI           | Tailwind CSS + shadcn/ui                           | Design-system tokens and reusable primitives (badges, cards, nav, forms) |
| Auth         | NextAuth (Auth.js) — Google + Email/OTP providers  | Passwordless creator sign-in; admin is a fixed seeded account, not self-registered |
| Database     | Prisma + PostgreSQL                                | Source of truth for products, creators, applications, affiliate links, orders, and commissions |
| File storage | Local filesystem (`public/uploads/`)                | Product images uploaded by admin; DB stores `/uploads/...` paths only |
| Cache        | None (MVP)                                         | No Redis or application cache layer; read from PostgreSQL directly |
| Background   | One scheduled call (server cron → `GET /api/cron/payout-reminder`, Fridays) + Telegram Bot API | Friday payout reminder to admin; Telegram messages are sent inline during requests, best-effort. No queues or workers |

## System Boundaries

| Path / area        | Owns | Must not |
| ------------------ | ---- | -------- |
| `app/(public)/r/[slug]` | Creator-attributed product landing page + no-payment checkout (built 2026-07-19; moved from `/p/[creator]/[slug]` 2026-11-10). `[slug]` is a 7-char base62 short code (`lib/affiliate-link-code.ts`) | Require buyer auth; mutate commission state; edit products; render creator identity (neither in-page nor in the URL) |
| `app/creator`      | Creator dashboard: browse products, apply to promote, view own links and earnings | Access other creators’ data; create/edit products; approve applications; change order/commission status |
| `app/admin`        | Admin dashboard: product CRUD, application approve/reject, order status (marking an order Delivered creates its commission as Pending), Friday payouts (`app/admin/payouts`: live due list, Excel export, mark paid) | Expose admin actions to creators; auto-trigger delivery itself (no logistics webhook/cron) |
| `app/sign-in`      | Shared sign-in entry (email OTP two-step, Google) for both creator and admin — not auth-gated itself | Contain role-specific dashboard UI |
| `app/sign-up`      | Redirect into creator onboarding after sign-in | Create an `ADMIN` account |
| `app/dashboard`    | Single role-aware redirect after any sign-in method | Render any UI of its own |
| `app/api` (or Route Handlers colocated with features) | Validated mutations with auth/ownership checks | Bypass `lib/commission` for commission transitions; trust client role claims without server verification |
| `lib/commission`   | Creating a commission as Paid the moment `deliveryStatus` becomes Delivered (auto-setting `cashReconciledAt` alongside it); resolving any pre-2026-07-29 Pending commission to Paid | Be called from public checkout for commission creation before Delivered; contain unrelated UI or product CRUD |
| `lib/auth-helpers.ts` | `requireCreator()`/`requireAdmin()` — API route session + role guards | Encode business commission rules |
| `prisma`           | Schema, migrations, and entity relations           | Store binary image data |
| `components/ui`    | Generated shadcn primitives (via `npx shadcn add`) | Hold domain business rules |
| `components/*` (outside `ui/`) | App-level components that compose `components/ui/*` (e.g. `status-badge.tsx`) | Duplicate a primitive already in `components/ui/` |

## Storage Model

| Store | What lives here | What does not |
| ----- | --------------- | ------------- |
| **PostgreSQL (via Prisma)** | Products (price, fixed Birr commission amount, category/subcategory, images, colors, sizes, features, care, shipping, returns), creators, applications + status, affiliate links (creator+product), orders + delivery status + fulfillment status + cash-reconciliation status + immutable creator attribution, commissions + pending/paid status | Binary files, session secrets as plaintext product data, computed UI-only state |
| **File storage (`public/uploads/`)** | Product image binaries | Structured business records; commission or order state |
| **Cache** | Nothing in MVP | Do not introduce a cache for auth, commissions, or inventory without updating this file |

**Entities (relational source of truth):** Product, Creator, Application, AffiliateLink, Order, Commission. Implemented in `prisma/schema.prisma` — see that file's comments for field-level decisions not spelled out here (e.g. "Creator" and "Admin" are both a single `User` model distinguished by `role`, since NextAuth needs one identity model regardless of role; `Commission`'s "None" status is realized as "no row exists yet" rather than a stored enum value).

**Link views (`AffiliateLink.viewCount`)** count at most once per visitor per 24h. The `/r/[slug]` page reports a view from the browser (`LinkViewBeacon`, so crawlers and link previews never count) to `POST /api/public/links/[slug]/view`, which identifies the visitor by a random id in the `bv` cookie and records the last counted time in `LinkVisit` (unique per link + visitor; atomic insert-or-update guarded by the 24h cutoff). Views are stats only — never commission-relevant.

**Commission creation** (`lib/commission`) runs in one transaction: the commission row (unique per order) is inserted first, then stock is decremented atomically, so concurrent "Delivered" requests create one commission and deduct stock once. Once a commission exists, the order's fulfillment/delivery status and cash reconciliation are locked.

**Display formatting:** numbers use `toLocaleString("en-US")` and dates `formatDate()` (`lib/format.ts`, Addis Ababa time) — never the device locale, so server HTML and phones render identical text (hydration).

**Creator discount codes** (`lib/discount.ts`) — per product: `discountEnabled` switch, fixed `discountBirr` (< price) and `discountCode` (stored uppercase, matched case-insensitively). Buyers type the code at checkout; it is **never sent to the buyer's page** (only the amount, for the "Have a creator code? Save N ETB" hint) — approved creators see it on their product page. `POST /api/public/links/[slug]/discount` checks a code (yes/no + amount); `POST /api/public/orders` re-checks it and rejects invalid codes (400). The discount is taken **once per order** and snapshotted on `Order.discountBirr`/`discountCode`; every total uses `orderTotalBirr()` (price × qty − discount): admin orders list/CSV, order detail, invoice, creator revenue, GMV, admin email/Telegram, tracking page. Commission is always the full `commissionBirr`. Switching off keeps the saved code/amount.

**Site settings (`SiteSetting`)** — one row (id `site`, `lib/site-settings.ts`) for settings admins edit in Settings. Today: `orderPhone` + `showOrderPhone`, the "Questions about your order?" number with a Call now (`tel:`) button on the buyer's order confirmation, between the order number and the tracking link. `POST /api/public/orders` returns it as `contactPhone` (null when hidden or unset; a read failure never fails the order). Edited via `PATCH /api/admin/site-settings`. With no row yet it falls back to `NEXT_PUBLIC_CONTACT_PHONE`.

**Prisma 7 setup** — this project is on Prisma ORM 7, which moved the datasource connection out of `schema.prisma`:

- `prisma.config.ts` (project root) holds the `DATABASE_URL` for Migrate/introspection.
- Runtime `PrismaClient` construction uses the `@prisma/adapter-pg` driver adapter (`lib/prisma.ts` — the only place `PrismaClient` should be instantiated; import `prisma` from there, never construct a new client elsewhere).
- The generator emits a TS client to `generated/prisma/` (gitignored, regenerated via `npx prisma generate`) rather than into `node_modules`; import from `@/generated/prisma/client`.

**Order has two independent status dimensions** (do not collapse into one field):

- `deliveryStatus`: Placed → Delivered | Cancelled | Returned — set by the admin action "Mark Delivered" (or Cancelled/Returned)
- `cashReconciledAt`: `null` until the admin performs a separate "Mark Cash Reconciled" action confirming the COD cash for that order was actually collected

These are two distinct, independently-timestamped admin actions, not one combined step. COD means "delivered" and "cash collected" can diverge (buyer refuses at the door, courier mishandles cash), so the platform must not treat delivery-marked as proof that revenue exists.

## Backend Folder Structure

Route Handlers are centralized under `app/api/`, mirrored by the
same three boundaries as the pages themselves, rather than
colocated inside `app/(public)` / `app/(creator)` / `app/(admin)`.
This keeps the auth boundary obvious per-path once auth exists.

- `app/api/public/*` — no auth. Implemented: `GET
  /api/public/links/[slug]` (resolve an affiliate link to its
  product, for the landing page — returns product data only, never
  the creator's identity), `POST /api/public/orders` (checkout;
  resolves `productId`/`creatorId` server-side from the affiliate
  link, never trusts client-supplied IDs, per invariant 5).
- `app/api/creator/*` — creator-authenticated routes (catalog,
  applications, links, earnings, payout method, onboarding).
- `app/api/admin/*` — admin-authenticated routes (products,
  applications, orders, commissions, uploads, dashboard).
- `lib/api-response.ts` — `apiSuccess(data, status?)` /
  `apiError(message, status)`. Every route handler returns one of
  these — success is always `{ data }`, failure is always `{
  error: { message } }`.
- `lib/validations/*` — one Zod schema module per resource (e.g.
  `lib/validations/order.ts`). Every route handler parses `request
  .json()` through a schema before touching Prisma.

## Auth Implementation

- **NextAuth v5 (Auth.js, beta)**, App Router pattern: `auth.ts`
  (project root) exports `{ handlers, signIn, signOut, auth }`;
  `app/api/auth/[...nextauth]/route.ts` exports the handlers.
  Session strategy is **JWT**, not database — required because the
  Credentials provider (used for OTP) can't work with database
  sessions. `PrismaAdapter(prisma)` is still wired in for Google
  OAuth account linking (User/Account tables); the `Session` table
  in the schema exists but is unused while on JWT strategy.
- **Email OTP is a custom flow, not Auth.js's built-in Email
  provider** — that provider sends a magic *link*, not a 6-digit
  *code*, which doesn't match this spec. Instead: `POST
  /api/auth/request-otp` (`lib/otp.ts` + `lib/mailer.ts`) generates
  a 6-digit code, stores its sha256 hash in `VerificationToken`
  (repurposed from its usual magic-link-token role — same shape,
  `identifier`/`token`/`expires`, different meaning here), and
  emails it. A custom Credentials provider (id `"otp"` in
  `auth.ts`) verifies the code via `signIn("otp", { email, code })`.
  Codes are single-use and single-attempt (deleted on any
  verification attempt, match or not) — the only guess costs a
  full resend, since there's no rate-limiting infra to lean on
  instead (architecture.md Cache: None).
- **Dev-only OTP bypass**: entering `000000` as the code always
  succeeds when `NODE_ENV !== "production"` (`lib/otp.ts`), so
  local testing doesn't require checking Mailpit for the real code
  every time. Hard-gated on `NODE_ENV`, which Next.js sets
  automatically — there is no separate flag that could be left on
  by accident in a real deployment.
- **Google OAuth** has `allowDangerousEmailAccountLinking: true` —
  safe here specifically because both providers independently
  verify ownership of the same email before signing in (Google via
  OAuth, "otp" via a mailed code), which is exactly the condition
  that makes automatic email-based linking sound instead of risky.
- **Role** (`CREATOR`/`ADMIN`) is copied onto the JWT in the `jwt`
  callback and onto `session.user.role` in the `session` callback —
  available anywhere via `auth()`. Caveat: the role is only read
  from the DB at sign-in time, not on every request, so promoting
  an existing signed-in user to `ADMIN` (e.g. via reseeding)
  doesn't take effect until they sign out and back in.
- **Admin seeding**: `prisma/seed.ts` (`npx prisma db seed`)
  upserts a `User` row to `role: ADMIN` for whatever email is in
  `ADMIN_SEED_EMAIL`. Signing in with that email — OTP or Google —
  attaches to that existing row rather than creating a new
  `CREATOR` row, since `User.email` is unique and both sign-in
  paths upsert/look up by email.
- **Local dev email**: `docker-compose.yml` runs Mailpit (SMTP
  catcher, inbox UI at `http://localhost:8025`) so the OTP flow is
  testable without real SMTP credentials. Production must be
  pointed at a real provider via the `SMTP_*` env vars.
- **Post-sign-in redirect**: `app/dashboard/page.tsx` is a single
  role-aware redirect (`ADMIN` → `/admin`, else → `/creator`) used
  as the destination for all sign-in methods, so the role-routing
  logic exists in one place rather than being duplicated.

## File Storage Implementation

- **Local filesystem, no third-party service.** Product image bytes
  are written under `public/uploads/` (served statically by Next.js at
  `/uploads/<name>`), and only the resulting `/uploads/...` path is
  stored as a plain string in `imageUrls` — the DB still holds
  references only, never binaries.
- `POST /api/admin/uploads` (admin-only, `runtime = "nodejs"`) accepts
  the image as multipart form data, validates type (JPG/PNG/WEBP/GIF)
  and size (≤5MB), writes it to `public/uploads/`, and returns
  `{ url }`. The admin product form posts the file there directly; the
  returned URL is submitted in `imageUrls` on
  `POST`/`PATCH /api/admin/products`. Admins can also paste an external
  image URL instead of uploading.
- `public/uploads/` is gitignored. On a containerized deploy, mount it
  as a volume so uploaded images persist across restarts.

## Creator Payout Method

Not a payment gateway — this only tells admin where to manually
send a commission payout. Nothing here moves money automatically;
invariant 4 (manual status transitions only) is unaffected.

- `User.payoutMethod` (`BANK_TRANSFER` / `TELEBIRR` / `CBE_BIRR`,
  nullable) + `payoutAccountName` / `payoutAccountNumber` /
  `payoutBankName` (`payoutBankName` only meaningful for
  `BANK_TRANSFER`).
- `GET`/`PATCH /api/creator/payout-method` — creator-only, always
  scoped to `session.user.id`; a creator can only ever set their
  own. Validation is a discriminated union on `payoutMethod`
  (`lib/validations/payout.ts`) since `BANK_TRANSFER` requires a
  bank name and the mobile-money methods don't.
- Surfaced to admin on `GET /api/admin/commissions` /
  `app/admin/commissions` — the payout method sits directly next to
  "Mark paid" in the UI, since that's the moment admin actually
  needs it.
- The specific bank name (when `payoutMethod` is `BANK_TRANSFER`) and
  the wallet provider's display name (when `TELEBIRR`) are drawn from
  an admin-managed picklist, `PayoutOption` (`{ category: BANK |
  WALLET, name, isActive }`), not hardcoded — admin adds/deactivates
  entries at `app/admin/settings`. `GET /api/creator/payout-options`
  (creator-only, active-only) is what the sign-up and settings forms
  fetch to populate the bank dropdown / wallet label. This is
  reference data only — it doesn't change how or when money moves.

## Creator Onboarding Profile

Creators complete a one-time onboarding form after their first
sign-in. The profile is stored directly on `User` and includes:

- `creatorUsername` (unique handle; rules in `lib/username.ts`: starts
  with a letter, letters and underscores, numbers only at the end, no
  spaces; always saved lowercase. Set at onboarding only — Settings
  doesn't validate or change it, so older usernames keep working)
- `creatorPhone` (contact phone)
- `creatorDisplayName`
- `creatorPlatform` + `creatorProfileUrl`
- `creatorCategory`
- `creatorProfileStatus` (starts `PENDING` on submission)
- `creatorOnboardingCompletedAt` timestamp

The onboarding submission also sets the payout fields listed above,
so admins always see where to send commissions.

## Friday Payouts

Creator withdrawal requests were removed on 2026-11-11 (the
`Withdrawal` table was dropped). Instead, the admin pays creators every
Friday:

- A commission is created PENDING when its order is marked Delivered;
  its `createdAt` is that moment.
- The Friday payout covers PENDING commissions created by the most
  recent Thursday 11:59:59.999 PM, Africa/Addis_Ababa (UTC+3, no DST).
- Only creators whose covered total is ≥ 500 Birr
  (`PAYOUT_MIN_BIRR`) are due; smaller totals stay PENDING and roll
  over.
- The due list is computed live (`lib/commission/payouts.ts`
  `getDuePayouts`); nothing is stored until admin clicks "Mark paid".
  That creates a `Payout` row (amount, cutoff, payout details
  snapshot) and moves the covered commissions to PAID with
  `payoutId`, in one transaction that refuses a double-submit.
- Admin downloads the list as an Excel file
  (`GET /api/admin/payouts/export`, exceljs). Telegram never sends it.
- Creators see their next payout (amount + the Friday that is today or
  ahead) on their earnings page; admin sees the latest passed cutoff,
  i.e. what is payable now.

## Notifications and Telegram

- **Creator notifications** are stored in `Notification` (one row per
  creator per event; `readAt` for the bell) **and emailed** to the
  creator's account email (every creator, no opt-in; creators get no
  Telegram). Bell + email events: profile approved/rejected, product
  request approved/rejected, order delivered (one message that also
  covers "commission added"), commission paid (Friday payout), admin
  announcements (`Announcement` fans out one Notification + email per
  approved, active creator), and product paused / available again
  (`PRODUCT_PAUSED`/`PRODUCT_RESUMED`: a product a creator has a link to
  goes unpublished or out of stock, or comes back — from the admin
  product edit or a delivery that uses the last unit). Email-only:
  application received (onboarding submitted), payout details changed
  (security alert, `lib/payout-change-alert.ts`; not on first setup),
  account deactivated. Written by `lib/notifications.ts` after the
  triggering write succeeds; never throws, never blocks the action —
  emails go out after the response (`after()`), via `sendCreatorEmail`
  in `lib/mailer.ts` (one branded HTML + text layout; links use
  `APP_URL`, else `AUTH_URL`). No SMTP configured = emails skipped.
- **Admin alerts** go to Telegram only (the admin bell stays a derived
  action queue): new order, new creator signup, new product request,
  low stock (≤ `LOW_STOCK_THRESHOLD` = 5) / out of stock after a
  delivery, and the Friday payout reminder.
- **Linking**: `User.telegramChatId` / `telegramLinkToken`. Settings →
  Connect Telegram → `POST /api/telegram/link` returns a one-time
  `t.me/<bot>?start=<token>` deep link; the bot webhook
  (`POST /api/telegram/webhook`, verified by
  `TELEGRAM_WEBHOOK_SECRET`) swaps the token for the chat id. Private
  chats only; one chat ↔ one account; `/stop` or a 403 from Telegram
  unlinks. Works the same for admins.
- **Friday reminder**: `GET /api/cron/payout-reminder` (Bearer
  `CRON_SECRET`) sends "Payout day: N creators · X Birr" only on a
  Friday in Addis Ababa and only when someone reached the minimum. It
  never records or changes payouts. Schedule it with the server's cron
  (example in the route file). Telegram never sends the Excel file.
- Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`,
  `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`. With no bot token,
  everything Telegram is a silent no-op.
- **Creator profile status** now has `REJECTED` (admin Reject on the
  creators pages); rejected creators see "Profile not approved" with
  contact details on `/onboarding/pending`.

## Auth and Access Model

| Actor | How they authenticate | What they can do |
| ----- | --------------------- | ---------------- |
| Buyer | No account | View creator-attributed product page; place no-payment order; optionally receive tracking link via email |
| Creator | Google OAuth or email + 6-digit OTP (passwordless) | Browse catalog; apply to promote; view/copy own approved links; view own earnings (after admin approves the onboarding profile) |
| Admin | Single fixed/seeded identity (not creator self-signup) | Product CRUD + image upload; approve/reject applications; set order status (Delivered creates a Pending commission); record Friday payouts (marks the covered commissions Paid) |

Ownership rules:

- Every affiliate link belongs to exactly one creator and one product.
- A creator gets a link only after admin approval of that creator+product application.
- Creators read only their own applications, links, and commissions.
- Only admin mutates products, application decisions, order status, and commission payout status.
- Enforce auth and ownership on every mutation at the server boundary; never trust the client alone.

## AI and Background Task Model

No AI. The only scheduled work is the Friday payout reminder (see Notifications and Telegram); it only reads and sends a message.

- Do not add AI generation, embedding, or agent pipelines.
- Do not add background workers, job queues, payment webhooks, or logistics webhooks.
- Order status and commission status change only through explicit admin actions in the admin surface (via `lib/commission` for commission transitions).

## Invariants

- **Every `app/admin` page calls `requireAdminPage()` first** (`lib/auth-helpers.ts`). Next.js renders a page in parallel with its layout, so the layout's role check alone still let admin pages run their queries and ship the data (buyer names/phones) inside the response to a signed-in creator (found 2026-11-21). Non-admins are redirected before anything is read; the layout redirects too.
The codebase must never violate these rules:

1. **Admin-only catalog writes** — Only the admin can create or edit products. Creators never have write access to the product catalog.
2. **Forward-only commission lifecycle** — Commission status moves only None → Pending → Paid. The Commission row is created PENDING the moment an order is marked Delivered (decided 2026-11-11, reversing the 2026-07-29 auto-Paid rule); `cashReconciledAt` is auto-set at the same time if it wasn't already. It becomes Paid only through a Friday payout (`lib/commission/payouts.ts` `markPayoutPaid`) — there is no per-commission "Mark Paid". Cancelled or Returned orders never produce a commission. No money moves through the app (no payment gateway — invariant 4); "Paid" records the admin's offline payout.
3. **Approval before link** — An affiliate link is generated only after admin approval of that creator+product application — never before approval, and never for a rejected application.
4. **Manual status transitions only** — Order and commission status changes are explicit admin actions. No payment gateway, logistics webhook, or cron job may trigger them in this MVP.
5. **Immutable order attribution** — Creator attribution on an order is set at checkout and never reassigned afterward.
6. **Single commission mutator** — Nothing outside `lib/commission` creates or transitions commission records.
7. **Separate order and commission status** — Order status and commission status are distinct fields (and distinct UI badges). Do not collapse them into one status.
8. **No buyer accounts** — Buyers checkout without accounts; this part is unchanged. Creators sign in via OTP or Google only.
9. **Creator dashboard gated by admin approval** — after onboarding, creators see a pending state until an admin marks the profile approved.
10. **Payouts are recorded by admin** — creators can't request money; the admin pays the Friday list offline and records it. A payout only ever covers commissions from before a cutoff that has already passed, and each commission is paid at most once.
11. **Order fulfillment steps are explicit** — admin updates order progress through Placed → Processing → Shipped → Delivered; delivery status still drives commission creation.