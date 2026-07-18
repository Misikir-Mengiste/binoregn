# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Public storefront built (`/p/[slug]`). All three surfaces
  (admin, creator, public) now exist end to end.

## Current Goal

- User visual QA of all three surfaces against
  `context/ui-resources/` (admin) and the new storefront; then
  whatever gaps that turns up (Google OAuth creds, Cloudinary
  creds, remaining code-standards.md sections, attribution-window
  revisit if it comes up again).

## Completed

- Next.js app scaffolded at project root: TypeScript,
  Tailwind CSS, App Router, no `src/` dir, `@/*` import
  alias. `npm run build` passes.
- `context/` consolidated from `templates/context/` and
  `ui-design/` — `project-overview.md`, `architecture.md`,
  `design-system.md`, and `ai-workflow-rules.md` are filled
  in.
- Resolved the commission-trigger ambiguity (see Architecture
  Decisions below) and updated `architecture.md`,
  `project-overview.md`, and `design-system.md` to match.
- Global shell built: `shadcn/ui` initialized (style
  `base-nova`, Base UI, CSS-variable theming, Lucide icons);
  `app/globals.css` wires the full `design-system.md` palette,
  radius scale (`sm`/`md`/`lg`/`pill`), and shadow tokens into
  Tailwind v4, and maps shadcn's semantic slots
  (primary/secondary/accent/destructive/etc.) onto the brand
  colors; root layout uses the Segoe UI / Inter / -apple-system
  font stack; theme decided as light-only (no dark mode).
  `context/ui-context.md` filled in to document the mapping;
  `context/code-standards.md`'s Styling section filled in to
  match. `npm run build` passes; verified rendering in the
  running dev server.

- Prisma schema written (`prisma/schema.prisma`): User (role
  CREATOR/ADMIN) + Account/Session/VerificationToken (Auth.js
  shape), Product, Application, AffiliateLink, Order, Commission
  — reflecting the two-step delivery/cash-reconciliation model.
  Schema validates and the client generates and typechecks
  cleanly (`npm run build` passes). Project is on Prisma ORM 7;
  see the new "Prisma 7 setup" note in `architecture.md` for the
  `prisma.config.ts` / driver-adapter / generated-client-path
  details.
- Attribution is captured directly on `Order` from whichever
  `AffiliateLink` is active at checkout — no click-tracking or
  multi-visit persistence model was built (see Open Questions:
  this only covers the literal written spec, not the broader
  attribution-window question).

- Local Postgres running via `docker-compose.yml` (postgres:17-alpine,
  host port 5433 — 5432 was already taken by something else on this
  machine). First migration (`20260718163425_init`) applied; `.env`
  points at it. `npm run build` passes end to end.
- Backend folder structure + public API endpoints built (see
  "Backend Folder Structure" in `architecture.md`):
  `lib/api-response.ts`, `lib/validations/order.ts`, `GET
  /api/public/links/[slug]`, `POST /api/public/orders`. Smoke-tested
  live against the local database (seeded a creator/product/
  application/link, hit both endpoints via curl) — lookup, 404 on
  unknown slug, order creation, and validation-rejection all
  verified working. `code-standards.md`'s API Routes section filled
  in to match. `npm run build` passes.
- `app/api/creator/*` and `app/api/admin/*` are deliberately not
  built yet — every route there needs a real auth/ownership check,
  and NextAuth doesn't exist yet.
- **NextAuth (Auth.js v5 beta) wired up and verified end-to-end**,
  not just typechecked — see the new "Auth Implementation" section
  in `architecture.md` for the full design (JWT sessions, custom
  OTP Credentials provider since Auth.js's built-in Email provider
  only does magic links, Google OAuth with safe email-linking,
  role-on-session, admin seeding). Live-tested via curl against the
  running dev server + a local Mailpit container standing in for
  real SMTP: requested a code, read it from the actual delivered
  email, signed in, confirmed the session carried `role: "ADMIN"`
  for the seeded admin, and confirmed a replayed/reused code is
  correctly rejected. Google's flow is wired but untested — no
  real Google Cloud OAuth credentials yet (`AUTH_GOOGLE_ID`/
  `AUTH_GOOGLE_SECRET` are empty in `.env`).
- Seeded admin: `ADMIN_SEED_EMAIL` in `.env` was defaulted to
  natixr7@gmail.com (the account email on this machine) —
  **confirm this is really who should be the platform admin**;
  change it and rerun `npx prisma db seed` if not.
- `docker-compose.yml` gained a `mailpit` service (local SMTP
  catcher, inbox at `http://localhost:8025`) alongside Postgres.
- **`doc/backend-api-plan.md` written**, then **fully implemented
  and live-tested (2026-07-18)**. All six open questions in the
  plan were resolved during implementation (see that doc's
  "Resolved during implementation" section) rather than blocking
  on individual answers, per explicit instruction to proceed
  "based on the project scope."

  Built:
  - `lib/auth-helpers.ts` — `requireCreator()`/`requireAdmin()`,
    every creator/admin route starts with one of these.
  - `lib/commission/` gained `orderHasCommission()` (locks
    delivery/cash-reconciliation mutation once a commission
    exists) alongside `maybeCreateCommission()` and
    `markCommissionPaid()`.
  - `lib/validations/{application,product,order-status}.ts`.
  - Creator: `GET /api/creator/products`, `GET|POST
    /api/creator/applications`, `GET /api/creator/links`, `GET
    /api/creator/earnings`.
  - Admin: `GET|POST /api/admin/products`, `PATCH
    /api/admin/products/[id]`, `GET /api/admin/applications`,
    `PATCH /api/admin/applications/[id]` (approves create the
    `AffiliateLink` in the same transaction — invariant 3 enforced
    in code), `GET /api/admin/orders`, `PATCH
    /api/admin/orders/[id]/delivery`, `PATCH
    /api/admin/orders/[id]/cash-reconciled`, `GET
    /api/admin/commissions`, `PATCH
    /api/admin/commissions/[id]/pay`, `GET
    /api/admin/dashboard/summary`.

  Live-tested end to end via curl against the running dev server
  with real sessions (admin + a fresh creator signed in through
  the actual OTP flow) and real seeded data: full happy path
  (product → apply → approve → link → public order → deliver →
  cash-reconcile → commission appears → pay → earnings/dashboard
  reflect it correctly) plus every edge case — duplicate
  application (409), re-deciding an application (409), order
  mutation locked once a commission exists (409, both delivery and
  cash-reconciled), paying an already-paid commission (409),
  creator hitting an admin route (403), admin hitting a creator
  route (403), unauthenticated request (401). All passed.
  `npm run build` passes throughout.

- **Worked through the four "Next Up" items from the previous
  session (2026-07-18)**, per explicit instruction to proceed on
  all four and resolve what could be resolved without the user's
  direct action:

  1. **Google OAuth — still blocked, not code-blocked.** Wired up
     already (previous session); still needs real
     `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` from a Google Cloud
     OAuth app, which only the user can create. Checklist given;
     no further action possible on this end until credentials
     exist. Once they're in `.env`, an interactive browser sign-in
     (not scriptable by curl) is still needed for full
     verification.
  2. **Admin dashboard — fully built and live-tested.** See
     "Admin Dashboard Implementation" note below.
  3. **Image storage — Cloudinary chosen, signed-upload endpoint
     built, blocked on real credentials.** `lib/cloudinary.ts`,
     `POST /api/admin/uploads/signature` (admin-only, verified:
     200 with signature payload for admin, 401 unauthenticated,
     403 creator). Client-side direct-upload wired into
     `ProductForm`. Cannot live-test an actual image upload without
     real `CLOUDINARY_*` credentials — checklist given.
  4. **Attribution window — resolved.** Keeping the already-built
     simple behavior (no persistent cross-visit tracking). See
     Architecture Decisions below; Open Questions is now empty.

  `context/architecture.md` updated: File Storage Implementation
  section (Cloudinary), System Boundaries table corrected to real
  folders (`app/admin`, `app/creator`, `app/sign-in` — not
  parenthetical Next.js route groups, which would've hidden the
  `/admin` URL prefix entirely). `context/code-standards.md`'s
  Next.js section filled in (server components fetch via Prisma
  directly; client components mutate via `/api/*` + `router
  .refresh()`; route-group layouts own the auth gate, so pages
  don't re-check). `context/design-system.md` gained a `--peach-700`
  token for the "Pending" status text color, which the doc
  previously gave as a bare hex with no named token.

## Admin Dashboard Implementation

Built at `app/admin/*` (real folder, not a route group) plus a
shared `app/sign-in/page.tsx`:

- `app/sign-in/page.tsx` — two-step email OTP (request code →
  verify code) plus a Google button. Necessary because Auth.js's
  auto-generated `/api/auth/signin` page can't drive a two-step
  custom credentials flow.
- `app/admin/layout.tsx` + `admin-sidebar.tsx` — session/role gate
  (redirects to `/sign-in` if unauthenticated, shows a plain
  "no access" message if authenticated but not `ADMIN`) plus the
  sidebar nav from `design-system.md`'s spec.
- `app/admin/page.tsx` (Overview) — the three dashboard summary
  cards, backed by a new shared `lib/dashboard.ts` (used by both
  this page and `GET /api/admin/dashboard/summary`, avoiding
  duplicating the aggregation query).
- `app/admin/products/` — list + create/edit form, including the
  Cloudinary direct-upload flow.
- `app/admin/applications/` — list with Approve/Reject actions.
- `app/admin/orders/` — list with Mark Delivered/Cancelled/Returned
  and Mark Cash Reconciled actions; visibly locks (no action
  buttons, "Locked" message) once a commission exists, matching
  the backend's 409 behavior.
- `app/admin/commissions/` — list with Mark Paid.
- New shared `components/status-badge.tsx` — one badge component
  covering all three status vocabularies (application/delivery/
  commission) per `design-system.md`'s table.
- New shadcn primitives added: `input`, `label`, `card`, `badge`.

**Fixed after user review (2026-07-18):** the sidebar was built
from `design-system.md`'s text tokens only — the actual visual
reference (`context/ui-design-system.jpeg`, the "NovaShop" mockup
`design-system.md` was itself derived from) was never opened.
Comparing against it surfaced a real structural gap: no brand mark,
no icons paired with nav labels, and no user-identity/sign-out
affordance anywhere (there was literally no way to sign out).
`admin-sidebar.tsx` now has all three — Lucide icons per nav item,
a brand mark at top, admin email + sign-out at the bottom —
adapted from the reference's structural rhythm (not copied
literally; the reference's cart/wishlist/search don't apply to an
admin CRUD dashboard). Verified live: sidebar HTML contains the
brand text, the admin's email, "Sign out", and 7 icon `<svg>`
elements (5 nav + logo + logout).

**Also added (2026-07-18): dev-only OTP bypass.** Entering `000000`
as the sign-in code always succeeds when `NODE_ENV !== "production"`
(`lib/otp.ts`) — skips needing to check Mailpit for the real code
during local testing. Hard-gated on `NODE_ENV`, which Next.js sets
automatically, so there's no separate flag that could be
accidentally left on in a real deployment. Live-tested: signing in
with `000000` against a freshly-requested code succeeds and returns
a valid session.

## Full Admin Redesign (2026-07-18)

User provided a second reference image (a "ColorPixel" fintech
dashboard mockup — sidebar with icon nav + left-accent-bar active
state, search bar, greeting header, 3-card row, transaction table,
right panel with a gradient card, a payments list, and activity
progress bars) and asked for the full admin UI to follow it
structurally, with content/features mapped to this project — no
fabricated features (no fake "customer support" contact flow, no
inert mail/notification icons with nothing behind them).

Mapping used, and why:

- The reference is a single "Dashboard" page — its elaborate right
  panel (credit-card visual, payments, activity bars) maps to
  `app/admin/page.tsx` (Overview) only. `Products`/`Applications`/
  `Orders`/`Commissions` stay 2-column (sidebar + content); a
  repeated right panel on every CRUD page wasn't in the reference
  and wouldn't obviously make sense on a product-edit form.
- Sidebar: switched from the previous pill-active style to the
  reference's left-accent-bar + light-violet-background active
  state; added a brand mark at top (already had icons + sign-out
  from the prior fix). The reference's "Customer Support" box has
  no equivalent feature, so it became a real "Add a product"
  shortcut instead of invented support content.
- Search bar → real client-side filtering added to all four list
  pages (`components/search-input.tsx`, reused everywhere),
  filtering by name/buyer/creator per page — not decorative.
- "👋 Hi, [name]" greeting → literal, using the admin's email.
- 3-card row → recent products (image, name, price + commission
  instead of the reference's fake star ratings, since we don't
  have reviews).
- Transaction history table → recent orders (buyer, product,
  delivery status badge, price).
- Credit-card visual → repurposed as a violet→pink gradient
  "Pending commissions" card with a progress bar (paid-this-month
  vs pending ratio) — reuses the same brand gradient already used
  for primary CTAs elsewhere.
- "Payments" list → recent commission payouts (creator, amount,
  paid date).
- "Recent activity" bars → real computed percentages: % orders
  delivered, % applications approved, % commissions paid (not
  placeholder numbers).
- Mail/bell icons in the reference's top-right → dropped entirely;
  there's no notification/messaging system in scope, and adding
  icons with nothing behind them would be exactly the kind of
  half-finished UI this project's workflow rules warn against.
  Kept only the identity piece (initials avatar + email + "Admin").

New files: `components/initials-avatar.tsx`, `components/search
-input.tsx`. `app/admin/page.tsx` substantially rewritten.

**Testing:** `npm run build` clean after every change. All five
admin pages verified via curl (200 status, search input present on
each of the four list pages, Overview's new sections all render
real seeded data — recent products, recent orders with both test
buyers, activity/payout section headers). Dev server log checked
for runtime/hydration errors — found and fixed one real bug this
way (a leftover `asChild` prop usage from an earlier edit, caught
via `ReferenceError: Button is not defined` in the log; confirmed
resolved by a clean build and passing requests afterward). Same
browser-automation caveat as before: no clicking/typing was
scripted in an actual browser.

**Testing performed:** `npm run build` after every page (all
clean). Auth-gate verified via curl (unauthenticated → 307 to
`/sign-in`; authenticated admin → 200). Server-rendered HTML
verified to contain the real seeded data on every page (both
existing test products, the approved application, both test
orders in their different states — one correctly showing "Locked"
with a `PAID` commission, the other correctly showing the action
buttons with no commission yet). Dev server log checked for
runtime/hydration errors — none found.

**Testing NOT performed, and why:** no browser-automation tool
(Playwright/Puppeteer/etc.) is available in this environment, so
actual client-side interactions — submitting the create-product
form, clicking Approve/Reject, an in-browser image upload — were
not scripted end-to-end. The underlying API calls those buttons
make were already fully verified via curl in the prior session.
**If you have a browser open against `http://localhost:3001`,
please click through the flows yourself** (sign in, create a
product, approve an application, mark an order delivered/cash
-reconciled) and report back anything that looks wrong.

## Creator Dashboard Implementation (2026-07-19)

Built at `app/creator/*` (real folder, matching `app/admin`), same
design language and structure as the admin dashboard:

- `app/creator/layout.tsx` + `creator-sidebar.tsx` — same sidebar
  chrome as admin (brand mark, icon nav, left-accent-bar active
  state, sign-out), nav scoped to what a creator can actually do.
  Role-gated on `CREATOR` (mirrors admin's `ADMIN` gate).
- `app/creator/page.tsx` (Overview) — same structural pattern as
  admin's Overview: KPI cards (pending/paid earnings, active link
  count), a "browse products" preview row, and a right panel
  (identity, gradient "Pending earnings" card, recent payouts,
  an approved-applications activity bar).
- `app/creator/products/` — the full catalog, built precisely to
  `design-system.md`'s "Product card (creator catalog)" spec (140px
  thumbnail, 13.5px/600 name, 14px/700 price, commission badge
  shown **only** after approval, "Apply to earn commission" CTA
  otherwise) — the one page in this project that had a written
  visual spec I hadn't actually followed exactly until now.
- `app/creator/applications/` — read-only list of the creator's own
  applications (no approve/reject — that's admin-only).
- `app/creator/links/` — approved affiliate links with a real
  copy-to-clipboard button (`components/copy-button.tsx`, builds
  the absolute URL from `window.location.origin` client-side, no
  env var to keep in sync).
- `app/creator/earnings/` — pending/paid totals + full commission
  list.

**New URL decision**: affiliate links are `/p/[slug]` — chosen now
because the Links page needs *something* concrete to construct and
copy, even though the actual public storefront page doesn't exist
yet. **The public storefront page must be built at exactly this
path** (`app/(public)/p/[slug]/page.tsx` or similar), or every link
a creator copies today will 404 later.

All data fetching follows the established convention (Server
Components query Prisma directly, scoped by `session.user.id` —
same `where: { creatorId }` pattern already verified correct at the
API layer). Search added to Products and Applications
(`components/search-input.tsx`, reused from the admin build).

**Testing:** `npm run build` clean. All five pages verified via
curl with a real creator session (200 on every route; admin
correctly blocked from `/creator` with the same "no access"
message pattern as creator-blocked-from-admin). Verified the
approval-based catalog badge logic is correct by inspecting the
RSC flight payload directly (`applicationStatus":"APPROVED"` vs
`null` per product) after a plain-text grep gave a false negative —
dev-mode streaming fragments interpolated JSX text across chunks,
so literal phrase matching (e.g. "Earn 150 Birr commission") can
miss even when the data and logic are both correct. Worth
remembering for future verification passes: check the RSC payload
for the actual data, don't trust a phrase-grep miss as proof of a
bug. Dev server log checked — no new errors. Same browser
-automation caveat as the admin build: no clicks were scripted.

## In Progress

- None yet.

## Completed (2026-07-19 — Admin Sadax exact chrome pass)

- Shared Figma chrome: `KpiStrip` (single card + vertical
  dividers + inline accent), `Breadcrumbs`, `PageHeader` (+ More
  Actions), `TableToolbar` (search / status / date / More Filter),
  `Pagination`, status pills with dots (Delivered → blue
  “Completed”).
- Sidebar: sticky full-height, `⌘S` search hint, gray active
  state + teal icon, Main Menu + Others, avatar + chevron footer.
- Overview matches `01`: Welcome header, KPI strip, bar chart +
  analytics donut, full-width Recent Orders table (no invented
  right rail). Chart heights are decorative; counts are real.
- Products/Orders/Applications/Commissions: breadcrumbs, KPI strip,
  table thead gray, Details+⋯, pagination. Product form: two-column
  cards + sticky Save/Add footer + larger upload slots.
- Still skipped (out of scope): Inbox, stock, card payments, Add
  Order, Schedule, invoice PDFs, category/SKU fields.
- `npm run build` passes.

## Completed (2026-07-19 — Public storefront)

- Built `app/(public)/p/[slug]/page.tsx` — the buyer-facing product
  landing + checkout page, at the exact URL the creator dashboard
  already commits to and copies into real links (see the Creator
  Dashboard Implementation note above). Route group `(public)` used
  deliberately here (unlike `app/admin`/`app/creator`, which are
  real folders) — this is the one case where hiding the URL segment
  is exactly what's wanted, since the shareable link has to be
  `/p/[slug]`, not `/public/p/[slug]`.
- Server component fetches the product directly via Prisma
  (established convention) and **deliberately never selects the
  creator relation at all** — not just omits it from the response,
  it's never loaded into the page in the first place. `notFound()`
  for an invalid/expired slug, with a styled `not-found.tsx`.
- `checkout-form.tsx` (client) posts to the existing, already
  -tested `POST /api/public/orders` — no new order-creation logic,
  reuses the real attribution/validation path instead of
  duplicating it. Shows an inline confirmation state (order id)
  rather than redirecting somewhere that doesn't exist.
- Visual language matches the current Sadax-based admin/creator
  system (`rounded-[10px]` cards, `shadow-card`, teal primary,
  `FormCard`-style section header) — no dashboard chrome (no
  sidebar, no KPI strip), since none of that applies to a buyer
  -facing page. Caught up on the full admin Sadax redesign
  (teal palette, KpiStrip, Breadcrumbs, PageHeader, TableToolbar,
  Pagination) before building this, specifically so the new page
  wouldn't be styled against the old violet/pink system.
- **Live-tested the full loop**: opened the real page for an
  existing approved link (200, correct product info), confirmed an
  invalid slug 404s with the styled not-found page, placed a real
  order through the exact endpoint the checkout form calls,
  confirmed it appears correctly in the admin orders list with the
  right creator attribution, and confirmed **zero occurrences** of
  the creator's email or id anywhere in the storefront page's
  output — the identity-leak check this project has run at every
  public-facing surface so far.
- Found and correctly diagnosed a since-self-resolved issue: dev
  logs showed a `Module not found: Can't resolve
  './overview-orders'` error (with a cascading `KpiStrip`
  crash) from earlier concurrent edits. Confirmed the file existed
  and `/admin` rendered correctly by the time I checked — no fix
  needed, but worth recording that I verified it live rather than
  assuming the log noise was stale.
- `npm run build` clean.

## Completed (2026-07-19 — Creator products/links Sadax polish)

User asked to build "the influencer side that sees all products and
generates the affiliate link" — clarified first, since "generate
the link" could have meant either (a) the existing
apply-then-admin-approves flow, or (b) a new self-serve instant
-link feature that would remove the approval-control invariant.
Confirmed it meant (a): verify/polish what already exists, not
change the business rule.

- `creator-sidebar.tsx` rewritten to match `admin-sidebar.tsx`
  exactly (sticky full-height, search box, Main Menu / Others
  grouping, avatar+chevron footer) — it was still on the pre-Sadax
  pill-nav design. `layout.tsx` updated to the matching
  `min-h-screen bg-surface-100` wrapper.
- `app/creator/products/`: added `PageHeader` + a `KpiStrip`
  (available products / active links / pending applications, all
  real counts) around the existing card grid. Kept the grid itself
  (not converted to the Sadax data-table pattern) since it has its
  own explicit spec in `design-system.md` ("Product card (creator
  catalog)") and is a browse-and-apply surface, not a management
  table. Fixed leftover `violet-100`/`pink-100` class names (legacy
  aliases still resolved correctly to teal, but new code should use
  the real names).
- `app/creator/links/`: added `PageHeader`, wrapped the list in the
  same card-container style as the rest of the Sadax system,
  fixed the same leftover legacy class name.
- **Live-tested the complete real flow end to end**, not just the
  individual pages: admin created a brand-new product → it appeared
  immediately in the creator's catalog (unapplied) → creator applied
  → admin approved → a real `AffiliateLink` was generated → the link
  appears correctly on the creator's (now-polished) Links page → the
  link **actually resolves on the live public storefront**
  (`/p/[slug]`, 200, correct product name). This is the first time
  the full chain — admin creates, creator discovers, creator applies,
  admin approves, creator shares, buyer would land on a working page
  — was verified in one continuous pass rather than in separate
  pieces across different sessions.
- `npm run build` clean throughout; dev log checked, no new errors.

## Completed (2026-07-19 — Landing page)

Replaced the placeholder `app/page.tsx` (a single centered heading
since the "global shell" unit) with a real marketing landing page
at `/`. No design reference exists for this specific page (the
Sadax set is admin-only, the storefront reference didn't cover a
marketing page either), so it was designed from scratch using the
established teal system — header with brand + Sign in, hero, a
4-step "How it works" (Browse → Apply → Get your link → Earn on
delivery, matching the real flow exactly), three grounded value
-prop cards, closing CTA, footer.

Deliberately did not invent any unearned credibility markers — no
fake user counts, testimonials, or stats, since this is a real
early-stage platform with no real numbers to show yet. Every claim
on the page maps to an actual mechanic that exists in the product
(fixed Birr commission, no membership fee, dashboard tracking).

Verified live: `npm run build` (now statically prerendered — no
per-request data needed), all copy sections present, all three
"Sign in" CTAs correctly link to `/sign-in`, no console/server
errors.

## Completed (2026-07-19 — Password sign-in and sign-up)

User asked to "add normal sign in and sign up." Flagged first,
since this directly contradicted a documented invariant
("do not introduce password-based auth for creators") from the
original product discovery — confirmed it was a deliberate change,
not a misunderstanding, before touching anything.

- Schema: `User.passwordHash String?` (migration
  `20260718215641_add_password_hash`). `null` for OTP/Google-only
  accounts.
- `lib/password.ts` — bcryptjs, 12 salt rounds (no native-compile
  dependency, unlike `bcrypt`).
- `POST /api/auth/sign-up` — **the critical security property**:
  only ever creates a brand-new `User` row. If the email already
  exists — including the seeded admin's — it 409s rather than
  attaching a password to that row. This isn't optional hardening;
  without it, an unauthenticated POST could set a password on
  anyone's existing account (including the admin's) since, unlike
  OTP or Google, a sign-up POST proves no ownership of the email
  before touching the User row. Live-tested this specifically:
  confirmed sign-up against `ADMIN_SEED_EMAIL` correctly 409s.
- Second Credentials provider (id `"password"`) in `auth.ts`. Fails
  closed for an account with no `passwordHash` — live-tested that
  password sign-in against an OTP-only account is correctly
  rejected, not silently accepted.
- **Found and fixed a real pre-existing bug while implementing
  this**: `/sign-in` hardcoded `router.push("/admin")` after every
  sign-in method, regardless of role — every creator who ever
  signed in through the actual UI (not curl) would have landed on
  "you don't have access." Fixed with a single shared
  `app/dashboard/page.tsx` role-aware redirect (`ADMIN` → `/admin`,
  else → `/creator`), now used by all three sign-in methods
  instead of duplicating the role check three times.
- `/sign-in` restyled to the current Sadax system (it had never
  been touched since the very first auth-wiring pass) and given a
  method toggle: Email code / Password, plus the existing Google
  button and a link to `/sign-up`.
- New `/sign-up` page: name (optional), email, password, confirm
  password → sign-up → auto sign-in → `/dashboard`. Always creates
  role `CREATOR` — no self-serve path to `ADMIN` exists anywhere.
- Landing page CTAs updated: hero and closing section now offer
  both "Start earning"/"Sign up" (primary) and "Sign in"
  (secondary), instead of only ever linking to sign-in. Copy that
  said "no password needed" removed since it's no longer accurate.
- **Hit the same class of issue as the Prisma-7-client-generation
  gotcha earlier**: after migrating, the long-running dev server
  (started in the user's own terminal, not by me) kept using a
  stale in-memory Prisma Client without `passwordHash`, throwing
  `PrismaClientValidationError: Unknown argument passwordHash` —
  even though `npm run build` (a fresh process) picked up the
  regenerated client fine. Since this was the user's own terminal
  process, asked before restarting it rather than killing it
  unilaterally.
- Live-tested exhaustively: sign-up creates an account (201);
  duplicate email 409; sign-up against the admin's email 409;
  weak password (<8 chars) 400; invalid email 400; correct-password
  sign-in succeeds with the right role on the session; wrong
  password rejected; password sign-in against an OTP-only account
  rejected; `/dashboard` correctly routes a fresh creator to
  `/creator` and the seeded admin to `/admin`. `npm run build`
  clean; dev log showed only the expected `CredentialsSignin`
  entries from the deliberate negative tests, nothing new.

## Completed (2026-07-19 — Creator payout method)

User asked to "add payment method." Flagged first — this could have
meant an online payment gateway for buyer checkout, which is
explicitly Out of Scope in `project-overview.md` and would have
contradicted the whole COD/commission-timing design. Confirmed it
meant a much smaller thing: letting creators specify where admin
should manually send their commission payout (bank account or
mobile money). No new invariant needed, no payment gateway
involved — admin still pays offline and marks the commission Paid
by hand, exactly as before.

- Schema: `PayoutMethod` enum (`BANK_TRANSFER`/`TELEBIRR`/
  `CBE_BIRR`) + 4 nullable fields on `User` (migration
  `20260718221136_add_creator_payout_method`).
- `GET`/`PATCH /api/creator/payout-method`, always scoped to the
  caller's own `session.user.id`. Validation is a discriminated
  union (`lib/validations/payout.ts`) — `BANK_TRANSFER` requires a
  bank name, the mobile-money methods don't.
- Surfaced on `app/admin/commissions` (new "Payout method" column,
  right next to the "Mark paid" action — that's the moment admin
  actually needs it) and on a new "Payout method" section on
  `/creator/earnings` (which also got the same Sadax
  `PageHeader`/`rounded-[10px]` restyle as Products/Links —
  superseding the "still pre-Sadax" note this section used to have).
- Hit the *exact same* stale-dev-server-Prisma-client issue as the
  password-auth migration earlier — this time it was the dev server
  I myself had restarted last time, so no need to ask again before
  restarting it.
- Live-tested: fetched empty payout info for a fresh creator, set a
  Telebirr method, confirmed a `BANK_TRANSFER` submission missing a
  bank name correctly 400s, confirmed unauthenticated access 401s,
  and — the actual point of the feature — confirmed the exact
  payout details set by the creator show up correctly on admin's
  live commissions page. `npm run build` clean; no new errors.

## Completed (2026-07-19 — Demo data)

Extended `prisma/seed.ts` (previously admin-only) with a
`seedDemoData()` step: 8 products, 4 creators (2 with a payout
method set, to demo that feature), 10 applications spread across
`PENDING`/`APPROVED`/`REJECTED`, the resulting affiliate links, and
6 orders spanning every real state the system has (placed;
delivered-not-reconciled; delivered+reconciled → commission
pending; delivered+reconciled+paid; cancelled) — so every status
filter, badge color, and KPI on every dashboard has something real
to show instead of looking empty or only showing whatever ad-hoc
rows accumulated from testing.

- Guarded against duplicate seeding: checks for a marker product
  name first and skips the whole demo block if already present.
  Verified by running `npx prisma db seed` twice — second run
  correctly skipped with no duplicates. Your own real products/
  creators are untouched either way; this is purely additive.
- Commission rows created directly with the same eligibility
  condition `lib/commission.maybeCreateCommission` enforces
  (delivered AND cash-reconciled), not by calling that function —
  `seed.ts` runs as a standalone script against its own
  `PrismaClient` instance, separate from the app runtime's
  `lib/prisma.ts` singleton, so the two shouldn't be mixed.
- Live-verified via the API (not just eyeballing the seed script's
  console output): correct counts per status across products,
  applications, orders, and commissions; confirmed the two seeded
  payout methods show up correctly on the live admin commissions
  page.

## Completed (2026-07-19 — Admin Products page grounded in real data)

User pointed at `context/ui-resources/04-admin-products-list.png`
specifically and asked to update the admin Products table/page to
match it. The page was already structurally close (breadcrumb,
`PageHeader`, `KpiStrip`, `TableToolbar`, table, `Pagination` were
all already in place from an earlier pass) — but a close read
against the reference surfaced real problems worth fixing, not
just cosmetic gaps: the KPI strip's labels didn't match what they
displayed ("Products Sales" showed the platform's total order
count, "Stock Products" showed delivered-order count, "Out of
Stock" showed cancelled-order count — none of these are product
metrics), the Status column was hardcoded to "Published" for every
single row with no backing field, the Stock column was a literal
`—` for every row (no stock concept exists in this schema), the
Price column's sub-line duplicated the exact same price a second
time, and the status filter dropdown's selected value was never
actually applied to the filtered list — pure decoration.

Fixed by grounding every element in something real, per the
`ui-resources/README.md`'s own scope rule ("map content only to
features that exist... do not add reference-only features"):

- KPI strip → Total Products, Active Links (real
  `affiliateLink.count()`), Avg. Commission (computed from real
  `commissionBirr` values), Pending Applications (real count) —
  each with an honest caption instead of a copy-pasted "last 365
  days" that doesn't apply to this app.
- Stock column → replaced with **Applications** (real per-product
  count via Prisma's `_count`).
- Status column → replaced with **Active Links**, a mint pill
  showing the real approved-link count or a muted "No links yet" —
  same colored-pill visual language as the reference, backed by a
  real derived fact instead of an invented enum.
- Price sub-line → shows the product's real commission amount
  instead of repeating the price.
- Status filter dropdown → now genuinely functional (All Products /
  Has active links / No links yet), and actually wired into the
  filter logic (it silently wasn't before).
- "Details" action renamed to "Edit", since that's what the button
  actually does — there's no separate read-only details view.
- Server component (`page.tsx`) rewritten to fetch the real
  supporting data (`_count` on applications/affiliateLinks per
  product, platform-wide active link count, average commission,
  pending application count) instead of unrelated order counts.

**Noticed in passing, not touched**: `app/creator/page.tsx` and
`app/creator/layout.tsx` have been externally rewritten to a
different visual direction entirely (hero banner, category icons,
"Best Deals for You" — closer to the original NovaShop reference
than Sadax) with its own `creator-theme` CSS scope and
`--creator-hero-start`/`--creator-hero-end` variables. Worth
knowing about before touching creator pages next — the "creator
still needs Sadax polish" framing from the last session's Next Up
is no longer accurate; it's on a third, distinct design direction
now.

Verified live: fake elements (`Published`, `Sell Price`, `Products
Sales`, `Stock Products`, `Out of Stock`) confirmed completely gone
from the rendered page (zero matches); real elements (`Active
Links`, `Avg. Commission`, `Pending Applications`, `No links yet`)
confirmed present; cross-checked the pending-applications number
against the live API directly rather than trusting the page alone —
correctly showed 0, which matches current reality (the demo
data's originally-seeded 6 pending applications have since been
approved/rejected through real use of the Applications page).
`npm run build` clean; no new errors in the dev log.

## Next Up

- `/creator` (Overview) is now on its own distinct design direction
  (see note above) — `/creator/applications` still needs the same
  Sadax treatment as Products/Links/Earnings if consistency across
  all creator pages is wanted, but "what should creator look like"
  is a real open question now, not just "needs polish."
- Get real Google OAuth credentials into `.env`, then do an
  interactive browser sign-in to fully verify the Google path.
- Get real Cloudinary credentials into `.env`, then verify an
  actual image upload through the Products page.
- Fill in the remaining sections of `code-standards.md` (General,
  TypeScript, Data and Storage, File Organization — still
  placeholders).

## Session Notes (2026-07-19 — UI resources)

- Imported SadaxCart / Sadax Team Figma screens into
  `context/ui-resources/` as named PNGs + catalog README.
  Screens: dashboard overview, card-grid+right-panel pattern,
  add product, products list, orders list, name/description form
  card. One duplicate overview image was discarded.
- Pointed `ui-context.md` at this folder as the next visual
  target; legacy `ui-design-system.jpeg` remains for history.

## Open Questions

None currently open.

## Architecture Decisions

- **No persistent cross-visit attribution — resolved, ship as-is**
  (decided 2026-07-18). Attribution stays exactly what's already
  built: whichever affiliate link the buyer is on at the moment
  they check out, no click-tracking/cookie persistence across
  separate visits. Explicitly chosen over first-click or last-click
  persistent models to avoid the added scope (a `Click` model, a
  buyer-side cookie, window/expiry rules) for the MVP. Revisit only
  if real usage shows buyers frequently browse via one link and buy
  later via another / directly.

- **Commission trigger is two-step, not Delivered-alone**
  (decided 2026-07-18). Orders are COD; the admin physically
  confirms delivery. "Delivered" and "cash actually collected"
  can diverge (buyer refuses at the door, courier mishandles
  cash), so the platform's revenue signal (cash reconciled)
  must not be inferred from the fulfillment signal (delivered).
  Implementation: `Order.deliveryStatus` and
  `Order.cashReconciledAt` are independent fields set by two
  separate admin actions; commission becomes Pending only when
  both are true. This also functions as a fraud brake — no
  payout is possible on a faked "delivered" status alone.

- **Theme is light-only** (decided 2026-07-18, during global
  shell setup). `design-system.md` defines a single light
  palette with no dark-mode tokens, so the shadcn-generated
  `.dark` class variant was removed rather than left half-wired
  to unstyled defaults. Revisit only if a dark mode is
  explicitly requested — it would need its own token pass in
  `design-system.md` first.

- **OTP codes are single-attempt, not just single-use** (decided
  2026-07-18). Verifying a code deletes it immediately regardless
  of whether it matched, so a mistyped code requires requesting a
  brand-new one rather than a retry. This is a deliberate
  substitute for real rate-limiting, which the project has no
  infra for (Cache: None in architecture.md) — it caps a brute
  force attempt at exactly one guess per resend cycle. Tradeoff:
  worse UX on typos. Revisit if that friction turns out to matter
  more than the security margin.

## Session Notes

- **Auth.js type augmentation gotcha**: `declare module
  "next-auth/jwt" { interface JWT {...} }` does NOT merge — that
  module only does `export * from "@auth/core/jwt"`, no local
  declaration to merge into, so TypeScript silently ignores it and
  `token.x` reads as `unknown`. `declare module "next-auth" {
  interface Session {...} }` works fine (real local declaration).
  Fix used in `auth.ts`: cast `token.id`/`token.role` at the read
  site instead of relying on ambient typing. If this trips you up
  again elsewhere, that's why.

- The written context docs (`architecture.md`,
  `project-overview.md`) previously said commission goes
  Pending on Delivered alone. That was a documentation gap
  from an earlier draft, not a real product decision — the
  actual decision (two-step trigger) was made during product
  discovery and has now been reconciled into the docs.
- A product-discovery conversation (creator/buyer/admin flows,
  technical complexity, data model, auth, scope) was run
  before implementation started. It covered the COD/delivery
  risk above but was paused before covering attribution
  windows, fraud/self-referral prevention, and full auth
  model details — pick that back up if those areas need
  deeper discussion before schema work.
