# Backend API Plan — Creator & Admin Surfaces

**Status: IMPLEMENTED (2026-07-18).** Every endpoint below is
built and live-tested end to end (curl against the running dev
server, real seeded data, full happy path plus every 401/403/404/
409 case) — see `context/progress-tracker.md` for the test log.
This remains the reference for how the creator/admin backend
works; keep it in sync if implementation changes.

## 0. What already exists

- `app/api/public/links/[slug]` (GET), `app/api/public/orders`
  (POST) — buyer-facing, no auth.
- `app/api/auth/*` — NextAuth (Google + email OTP), JWT sessions
  with `role` (`CREATOR`/`ADMIN`) on `session.user`.
- `lib/prisma.ts`, `lib/api-response.ts` (`apiSuccess`/`apiError`),
  `lib/validations/*` (Zod schemas per resource).

This plan covers everything else needed for the creator and admin
dashboards to function, per `context/project-overview.md`'s
Features section.

## 1. New shared building blocks

Needed before any route below can be written — these are their
own first unit.

### `lib/auth-helpers.ts`

```ts
// Returns the session user, or a ready-to-return NextResponse if
// unauthenticated/wrong role. Route handlers check the type:
//   const authed = await requireCreator();
//   if (authed instanceof NextResponse) return authed;
requireCreator(): Promise<SessionUser | NextResponse>
requireAdmin(): Promise<SessionUser | NextResponse>
```

Every creator/admin route starts by calling one of these — no
route reads `session` directly. This is what makes "auth check
exists on every mutation" (code-standards.md) mechanically
verifiable instead of a convention someone can forget.

### `lib/commission/index.ts`

The single commission mutator (architecture.md: "nothing outside
this folder mutates commission state directly").

```ts
// Idempotent. Creates a Commission (status PENDING, amountBirr
// snapshotted from the product) iff the order is DELIVERED AND
// cashReconciledAt is set AND no Commission exists yet for it.
// Called after both "mark delivered" and "mark cash reconciled" —
// whichever happens second is what actually creates the row.
maybeCreateCommission(orderId: string): Promise<void>

// PENDING -> PAID only. Throws if the commission isn't PENDING.
markCommissionPaid(commissionId: string): Promise<Commission>
```

## 2. Creator endpoints (`app/api/creator/*`)

All require `requireCreator()`. All reads are scoped to
`session.user.id` — a creator can never pass another creator's ID
and see their data (code-standards.md).

| Endpoint | Purpose |
|---|---|
| `GET /api/creator/products` | Full catalog, each product annotated with this creator's own application status (`null` if never applied) and affiliate link slug if approved. |
| `POST /api/creator/applications` | Body `{ productId }`. Creates an `Application` (status `PENDING`). 409 if one already exists for this creator+product (see Open Question 1). |
| `GET /api/creator/applications` | This creator's own applications, with product info and status. |
| `GET /api/creator/links` | This creator's own affiliate links (only exist for approved applications), with product info and slug. |
| `GET /api/creator/earnings` | Own commission totals: pending sum, paid sum, and the underlying list (each with order + product info). |

## 3. Admin endpoints (`app/api/admin/*`)

All require `requireAdmin()`.

| Endpoint | Purpose |
|---|---|
| `GET /api/admin/products` | All products (admin view). |
| `POST /api/admin/products` | Create a product: `name`, `description?`, `priceBirr`, `commissionBirr`, `imageUrls`. See Open Question 2 — no upload flow exists yet, so this takes URLs directly. |
| `PATCH /api/admin/products/[id]` | Edit product fields. No delete endpoint (see Open Question 4). |
| `GET /api/admin/applications` | List applications, optional `?status=` filter. |
| `PATCH /api/admin/applications/[id]` | Body `{ decision: "APPROVED" \| "REJECTED" }`. Only from `PENDING` (409 otherwise). On `APPROVED`, creates the `AffiliateLink` in the same transaction — this is invariant 3 (approval before link) enforced at the code level, not just documented. |
| `GET /api/admin/orders` | List orders, optional `?deliveryStatus=` filter. |
| `PATCH /api/admin/orders/[id]/delivery` | Body `{ status: "DELIVERED" \| "CANCELLED" \| "RETURNED" }`. Calls `maybeCreateCommission` after updating. See Open Question 3 — reversibility isn't decided yet. |
| `PATCH /api/admin/orders/[id]/cash-reconciled` | No body; sets `cashReconciledAt = now()`. Calls `maybeCreateCommission` after updating. |
| `GET /api/admin/commissions` | List commissions, optional `?status=` filter. |
| `PATCH /api/admin/commissions/[id]/pay` | Calls `markCommissionPaid`. 409 if not currently `PENDING`. |
| `GET /api/admin/dashboard/summary` *(optional — see Open Question 5)* | Aggregate counts for the dashboard summary cards in `design-system.md`: pending commission total (Birr), paid-this-month total, new/pending application count. |

## 4. Proposed build order

Respecting `ai-workflow-rules.md`'s "one boundary per unit, don't
mix route groups" rule:

1. `lib/auth-helpers.ts` + `lib/commission/index.ts` (no routes yet — pure logic, unit-testable via direct calls before anything depends on them)
2. Creator endpoints (all five — they're read-mostly and don't touch commission logic except reading it)
3. Admin: products + applications (product CRUD, application approve/reject — this is where invariant 3 gets enforced)
4. Admin: orders + commissions (delivery status, cash reconciliation, `maybeCreateCommission` actually getting exercised, mark-paid)
5. Admin dashboard summary (only if Open Question 5 says yes)

Each unit gets built, live-tested (curl + seeded data, same
pattern as the public endpoints and auth), and doc-synced before
moving to the next — not built all at once.

## 5. Open questions — resolved during implementation

The user approved building against "project scope" without
answering these individually, so each was resolved to the
lower-risk / most spec-consistent option and documented (in code
comments and here) rather than silently assumed. Revisit any of
these if they turn out wrong in practice.

1. **Re-application after rejection: kept blocked.** The schema's
   `@@unique([creatorId, productId])` on `Application` was left
   as-is — a rejected creator cannot currently re-apply to the
   same product. No migration was needed; this was the
   already-built, lower-risk default, and nothing in
   `project-overview.md` calls for re-application support.
2. **Product images: accept URLs directly.** `POST`/`PATCH
   /api/admin/products` take `imageUrls: string[]` as plain input
   — no upload flow. `architecture.md` only ever required the DB
   to store references, never binaries, so this doesn't need to
   change even once real upload/storage (S3 or Cloudinary,
   provider still undecided) is built later.
3. **Delivery status: locked once a commission exists, not
   write-once from the start.** Before a `Commission` row exists,
   admin can freely correct `deliveryStatus` and
   `cashReconciledAt`. Once `maybeCreateCommission` has fired
   (both are true and the row exists), both
   `PATCH .../delivery` and `PATCH .../cash-reconciled` return 409
   — `lib/commission.orderHasCommission()` enforces this. Rationale:
   architecture.md already treats the commission lifecycle as
   forward-only; the facts that produced a commission shouldn't be
   editable after the fact. Live-tested: locks correctly after
   cash reconciliation.
4. **No product delete endpoint: confirmed, not built.** Matches
   the plan's original recommendation — the data-integrity risk
   wasn't worth taking on speculatively.
5. **Admin dashboard summary: built.** It's explicitly listed
   under Admin Features in `project-overview.md` ("Dashboard
   signals for pending commissions, paid totals, and new
   applications"), not actually optional — `GET
   /api/admin/dashboard/summary`.
6. **Pagination: still not built.** Left for a later unit if list
   volumes ever justify it.
