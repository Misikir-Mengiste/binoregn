# UI Resources — SadaxCart Figma Reference

Source: SadaxCart / Sadax Team Figma dashboard screens (imported 2026-07-19).

This folder is the **visual source of truth** for the next UI pass on
admin (and later creator) dashboards. Open the PNGs when implementing
or reviewing layout — do not redesign from memory or from the older
violet/pink NovaShop mockup alone.

Previous reference kept for history: `context/ui-design-system.jpeg`
(violet/pink). The Sadax set below **supersedes it for structure,
density, sidebar, tables, and forms**. Brand color will shift from
violet/pink toward teal when `design-system.md` / `ui-context.md` are
updated in the UI pass.

## Screens

| File | Screen | Maps to in this project |
| ---- | ------ | ----------------------- |
| `01-admin-dashboard-overview.png` | Admin home: sidebar, KPI row, charts, recent orders table | `app/admin/page.tsx` |
| `02-card-grid-with-right-panel.png` | List + metric cards + entity card grid + right summary panel | Pattern for applications / commissions-style list+detail (adapt content; do not invent invoice/PDF features) |
| `03-admin-add-product.png` | Add product: two-column card form, image upload, sticky actions | `app/admin/products/new` (and edit) |
| `04-admin-products-list.png` | Products list: KPIs, search/filters, data table, pagination | `app/admin/products/` |
| `05-admin-orders-list.png` | Orders list: KPIs, filters, status badges, Details actions | `app/admin/orders/` |
| `06-form-name-description-card.png` | Close-up: name + description form card / rich text | Product form “Name and Description” section |

Duplicate of `01` was dropped from the import (same hash as the overview screen).

## Design direction (from these screens)

- **Layout:** Fixed left sidebar + main content; list pages use KPI row → filter toolbar → table/card body.
- **Accent:** Teal / seafoam primary (`~#00A389`–`#2EB6A1`), not violet.
- **Surfaces:** Light gray page (`~#F4F7F6` / `#F8F9FA`), white cards, soft radius (~8–12px), light borders.
- **Sidebar:** Brand + search + grouped nav (“Main Menu” / “Others”) + avatar/role footer.
- **Tables:** Thumbnail + primary/secondary text cells; soft status pills; “Details” + ⋮ actions; pagination.
- **Forms:** Section cards with header divider; labeled inputs; primary teal CTA; secondary outline actions.

## Scope rules when applying this UI

1. Map **structure and visual language** from these screens; map **content** only to features that exist (products, applications, orders, commissions, earnings).
2. Do **not** add reference-only features (Inbox, Promotion, Analytics Report, payment-by-card chrome, fake invoices) unless product scope expands.
3. Keep architecture invariants (manual COD fulfillment, commission rules, auth roles).
4. Before coding the restyle, update `context/design-system.md` and `context/ui-context.md` tokens to match this teal system so components do not hardcode hex.

## How to use in the next session

1. Read this README + open the relevant PNG for the page being built.
2. Update tokens in `design-system.md` / `ui-context.md` / `globals.css` if not already done.
3. Restyle one surface at a time (sidebar shell → overview → products list → product form → orders → …).
