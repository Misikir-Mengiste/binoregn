# Code Standards

## General

- [Principle — e.g. Keep modules small and single-purpose]
- [Principle — e.g. Fix root causes, do not layer workarounds]
- [Principle — e.g. Do not mix unrelated concerns in one
  component or route]

## TypeScript

- [Rule — e.g. Strict mode is required throughout the project]
- [Rule — e.g. Avoid any — use explicit interfaces or narrowly
  scoped types]
- [Rule — e.g. Validate unknown external input at system
  boundaries before trusting it]

## Next.js

- Default to server components. Add `"use client"` only for the
  specific piece that needs interactivity (a form, a button that
  mutates) — not the whole page.
- Server components fetch reads **directly via Prisma**
  (`lib/prisma.ts`), not by calling this app's own `/api/*` routes
  — fetching your own API from a server component is a redundant
  network hop. The `/api/*` routes exist for client-side mutations
  and any future external/mobile consumption.
- Client components that mutate call the `/api/*` routes (never
  Prisma directly — that boundary is what keeps auth/validation
  centralized) and call `router.refresh()` afterward to reload the
  server-fetched data, rather than managing duplicate local state.
- `app/admin/*` and (once built) `app/creator/*` pages don't
  re-check auth themselves — the route group's `layout.tsx` already
  gates on session + role. Route Handlers still must self-check
  (`requireAdmin()`/`requireCreator()`) since they have no shared
  layout to rely on.
- Keep route handlers focused on a single responsibility.

## Styling

- Use the CSS custom property tokens defined in `app/globals.css`
  (backed by `context/design-system.md`) — no hardcoded hex
  values in components.
- Follow the border radius scale in `context/ui-context.md`
  (`rounded-sm` / `rounded-md` / `rounded-lg` / `rounded-pill`)
  — do not invent ad-hoc radius values.
- Use `shadow-card` / `shadow-hover` for elevation — do not
  write raw `box-shadow` values.

## API Routes

- Parse `request.json()` through a Zod schema in
  `lib/validations/*` before any other logic runs. Never touch
  Prisma with unparsed request data.
- Enforce auth and ownership before any mutation — no route under
  `app/api/creator/*` or `app/api/admin/*` may be built without a
  real auth check once NextAuth exists (see
  `context/progress-tracker.md` for current status).
- Never trust client-supplied IDs for attribution or ownership
  (e.g. creatorId, productId on an order) — derive them
  server-side from an already-verified record (see
  `app/api/public/orders/route.ts` deriving attribution from the
  affiliate link, not from the request body).
- Return consistent, predictable response shapes via
  `lib/api-response.ts` — success is always `{ data }`, failure is
  always `{ error: { message } }`. Don't hand-roll response JSON
  in a route handler.
- Only return the fields a caller actually needs — e.g. the public
  link-resolution endpoint returns product data, never the
  creator's identity.

## Data and Storage

- [Rule — e.g. Metadata belongs in the database]
- [Rule — e.g. Large generated content belongs in file
  or blob storage]
- [Rule — e.g. Do not store large content directly in
  the database]

## File Organization

- `[folder]/` — [What belongs here]
- `[folder]/` — [What belongs here]
- `[folder]/` — [What belongs here]
- `[folder]/` — [What belongs here]s
