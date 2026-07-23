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
| Background   | None (MVP)                                         | No queues, workers, webhooks, or scheduled jobs |

## System Boundaries

| Path / area        | Owns | Must not |
| ------------------ | ---- | -------- |
| `app/(public)/p/[creator]/[slug]` | Creator-attributed product landing page + no-payment checkout (built 2026-07-19) | Require buyer auth; mutate commission state; edit products; render creator identity (we only use the username in the URL, not in-page) |
| `app/creator`      | Creator dashboard: browse products, apply to promote, view own links and earnings | Access other creators’ data; create/edit products; approve applications; change order/commission status |
| `app/admin`        | Admin dashboard: product CRUD, application approve/reject, order status, mark commissions paid | Expose admin actions to creators; auto-trigger payouts or delivery |
| `app/sign-in`      | Shared sign-in entry (email OTP two-step, Google) for both creator and admin — not auth-gated itself | Contain role-specific dashboard UI |
| `app/sign-up`      | Redirect into creator onboarding after sign-in | Create an `ADMIN` account |
| `app/dashboard`    | Single role-aware redirect after any sign-in method | Render any UI of its own |
| `app/api` (or Route Handlers colocated with features) | Validated mutations with auth/ownership checks | Bypass `lib/commission` for commission transitions; trust client role claims without server verification |
| `lib/commission`   | Creating and transitioning commission status (None → Pending → Paid) based on `deliveryStatus` AND `cashReconciledAt` together | Be called from public checkout for commission creation before Delivered; transition to Pending on Delivered alone without cash reconciliation; contain unrelated UI or product CRUD |
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

- `creatorUsername` (unique handle)
- `creatorPhone` (contact phone)
- `creatorDisplayName`
- `creatorPlatform` + `creatorProfileUrl`
- `creatorCategory`
- `creatorProfileStatus` (starts `PENDING` on submission)
- `creatorOnboardingCompletedAt` timestamp

The onboarding submission also sets the payout fields listed above,
so admins always see where to send commissions.

## Creator Withdrawals

Creators can request manual withdrawals from their **paid**
commission balance. Each withdrawal has:

- `amountBirr`
- `payoutMethod` + snapshot payout details
- `status` (`PENDING` → `APPROVED` or `REJECTED`)

Admins approve or reject withdrawals manually; creators see pending
requests and the remaining balance after withdrawals.

## Auth and Access Model

| Actor | How they authenticate | What they can do |
| ----- | --------------------- | ---------------- |
| Buyer | No account | View creator-attributed product page; place no-payment order; optionally receive tracking link via email |
| Creator | Google OAuth or email + 6-digit OTP (passwordless) | Browse catalog; apply to promote; view/copy own approved links; view own earnings (after admin approves the onboarding profile) |
| Admin | Single fixed/seeded identity (not creator self-signup) | Product CRUD + image upload; approve/reject applications; set order status; mark commissions Paid |

Ownership rules:

- Every affiliate link belongs to exactly one creator and one product.
- A creator gets a link only after admin approval of that creator+product application.
- Creators read only their own applications, links, and commissions.
- Only admin mutates products, application decisions, order status, and commission payout status.
- Enforce auth and ownership on every mutation at the server boundary; never trust the client alone.

## AI and Background Task Model

Not used in the MVP.

- Do not add AI generation, embedding, or agent pipelines.
- Do not add background workers, job queues, payment webhooks, or logistics webhooks.
- Order status and commission status change only through explicit admin actions in the admin surface (via `lib/commission` for commission transitions).

## Invariants

The codebase must never violate these rules:

1. **Admin-only catalog writes** — Only the admin can create or edit products. Creators never have write access to the product catalog.
2. **Forward-only commission lifecycle** — Commission status moves only None → Pending → Paid. Pending is created only when an order is BOTH marked Delivered AND has its cash reconciled (`cashReconciledAt` set) — whichever of those two admin actions happens second is what triggers the transition to Pending. Cancelled or Returned orders never produce a commission, and a Delivered order with unreconciled cash stays at None.
3. **Approval before link** — An affiliate link is generated only after admin approval of that creator+product application — never before approval, and never for a rejected application.
4. **Manual status transitions only** — Order and commission status changes are explicit admin actions. No payment gateway, logistics webhook, or cron job may trigger them in this MVP.
5. **Immutable order attribution** — Creator attribution on an order is set at checkout and never reassigned afterward.
6. **Single commission mutator** — Nothing outside `lib/commission` creates or transitions commission records.
7. **Separate order and commission status** — Order status and commission status are distinct fields (and distinct UI badges). Do not collapse them into one status.
8. **No buyer accounts** — Buyers checkout without accounts; this part is unchanged. Creators sign in via OTP or Google only.
9. **Creator dashboard gated by admin approval** — after onboarding, creators see a pending state until an admin marks the profile approved.
10. **Withdrawals require admin approval** — a withdrawal request is always pending until an admin approves or rejects it.
11. **Order fulfillment steps are explicit** — admin updates order progress through Placed → Processing → Shipped → Delivered; delivery status still drives commission creation.