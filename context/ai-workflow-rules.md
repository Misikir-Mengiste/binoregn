# AI Workflow Rules

These are mandatory rules for any AI coding agent working on the Affiliate Marketplace. Follow them exactly. Do not treat them as suggestions.

## Approach

1. Build this project with a spec-driven, incremental workflow.
2. Read these context files in order before any implementation or architectural decision:
   - `context/project-overview.md`
   - `context/architecture.md`
   - `context/ui-context.md` (and `context/design-system.md` when present)
   - `context/code-standards.md`
   - `context/ai-workflow-rules.md`
   - `context/progress-tracker.md`
3. Implement only what the context files define. Do not invent product behavior, auth flows, commission rules, or UI patterns.
4. Every screen and interaction must trace to project overview, architecture invariants, or the design system. If a spec is silent, stop and resolve the gap — do not decide unilaterally.
5. Treat these as non-negotiable product constraints for the MVP:
   - Single-seller model
   - Fixed Birr commission per product
   - Passwordless creator auth; seeded admin account
   - No online payment gateway
   - Manual order fulfillment and manual commission payouts
   - Commission created only when an order is marked Delivered
   - Affiliate links only after admin approval of the creator+product application

## Scoping Rules

1. Work on one feature unit at a time.
2. Prefer small, verifiable increments over large speculative changes.
3. Do not combine unrelated system boundaries in a single implementation step.
4. Stay inside one boundary per unit when possible:
   - `app/(public)` — landing and no-payment checkout
   - `app/(creator)` — creator dashboard
   - `app/(admin)` — admin dashboard
   - `lib/commission` — commission computation and status transitions only
   - `prisma` — schema and migrations
5. Do not mutate commission state outside `lib/commission`.
6. Do not add payment gateways, logistics webhooks, multi-seller support, percentage commissions, buyer accounts, or other out-of-scope features.
7. Do not "improve" scope by adding convenience features not listed in `project-overview.md`.

## When to Split Work

Split the current unit before coding if it combines any of the following:

1. Schema/migration changes with UI work
2. Auth changes with unrelated feature UI
3. More than one route group (`public`, `creator`, `admin`) in a single step
4. Multiple unrelated API routes
5. Commission logic changes with unrelated dashboard chrome
6. File-upload/storage setup with product CRUD UI (do storage plumbing first, then UI)
7. Behavior not clearly defined in the context files
8. A change that cannot be verified end to end in one short pass

If the unit cannot be verified quickly, the scope is too broad — split it.

## Handling Missing or Ambiguous Requirements

1. Do not invent product behavior missing from the context files.
2. If a requirement is ambiguous, update the relevant context file with the clarified rule before writing code.
3. If a requirement is missing, add it as an open question in `progress-tracker.md` and stop that unit until it is resolved.
4. Never guess on these topics — escalate via `progress-tracker.md` first:
   - Commission timing or status transitions
   - Order attribution rules
   - Who can approve applications or edit products
   - Whether a buyer needs an account
   - Payment, payout, or delivery automation
5. Prefer asking one concrete clarifying question over shipping an assumption.

## Protected Files

Do not modify the following unless the user explicitly instructs you to:

1. `components/ui/*` — generated shadcn/ui primitives; add via the shadcn CLI, do not hand-edit generated files
2. Generated Prisma client output under `node_modules/.prisma` or equivalent generated paths
3. Third-party library internals in `node_modules/`
4. Auth secret material, `.env`, `.env.*`, and credential files — never commit or rewrite secrets
5. Seeded admin identity configuration without an explicit request

You may add new app components that compose `components/ui/*`. You may change Prisma schema and run migrations when the current unit requires it and the model change is defined in context.

## Keeping Docs in Sync

1. Update `progress-tracker.md` after every meaningful implementation change.
2. Update the matching context file before continuing when implementation changes any of:
   - System architecture or route-group boundaries
   - Storage model (Postgres vs file storage responsibilities)
   - Auth or access model
   - Architecture invariants
   - Code conventions or standards
   - Feature scope (in or out)
   - UI tokens, status badges, or design-system rules
3. Do not leave code and docs disagreeing. If code must change a rule, change the doc in the same unit.
4. Record architecture decisions and why in `progress-tracker.md` when a durable choice is made.

## Before Moving to the Next Unit

Complete every item below. If any item fails, fix it before starting the next unit.

1. The current unit works end to end within its defined scope.
2. No invariant in `architecture.md` was violated, especially:
   - Only admin creates/edits products
   - Commission status moves only None → Pending → Paid
   - Pending commission only from Delivered orders
   - Cancelled/Returned orders never produce commission
   - Affiliate links only after approved applications
   - Order and commission transitions are manual admin actions
   - Order creator attribution is immutable after checkout
3. Order status and commission status remain separate fields and separate UI badges where both apply.
4. Creators can only access their own applications, links, and earnings.
5. Auth checks exist on creator and admin mutations; public checkout does not require buyer auth.
6. UI uses design tokens / design-system rules — no ad-hoc hex values or invented status colors.
7. `progress-tracker.md` lists the unit as completed and states the next unit.
8. `npm run build` passes.