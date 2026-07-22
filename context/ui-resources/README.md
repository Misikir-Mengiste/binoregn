# UI Resources — Larax + Storefront Reference

Source: Larax dashboard reference images + mobile storefront screens
(provided 2026-07-20).

This folder is the **visual source of truth** for the next UI pass on
admin + creator dashboards and the public storefront. Open the
screenshots when implementing or reviewing layout — do not redesign
from memory or from older mockups.

Previous reference kept for history: `context/ui-design-system.jpeg`
(violet/pink). The Larax set below **supersedes prior layouts** for
structure, sidebar, tables, and cards.

## Screens

| File | Screen | Maps to in this project |
| ---- | ------ | ----------------------- |
| `/Users/misaeldessalegn/.cursor/projects/Users-misaeldessalegn-affiliate-marketplace/assets/image-6ddad2c3-86c6-4eb8-8963-d05e78b6c880.png` | Larax dashboard overview: sidebar, top bar, KPI cards, charts, table | `app/admin/page.tsx`, `app/creator/page.tsx` |
| `/Users/misaeldessalegn/.cursor/projects/Users-misaeldessalegn-affiliate-marketplace/assets/image-3873b7b5-2788-43b2-890a-116dcf7abe60.png` | Larax list/table view: search, filters, table actions, pagination | `app/admin/orders/`, list pages |
| `/Users/misaeldessalegn/.cursor/projects/Users-misaeldessalegn-affiliate-marketplace/assets/image-a840bbef-0896-45e5-b9c8-8ae1f9e9215e.png` | Mobile product detail top (gallery + thumbnails + price) | `app/(public)/p/[creator]/[slug]` |
| `/Users/misaeldessalegn/.cursor/projects/Users-misaeldessalegn-affiliate-marketplace/assets/image-1b9405f1-9513-4e53-8d24-7e2858946c55.png` | Mobile product detail mid (quantity, buttons, shipping card) | `app/(public)/p/[creator]/[slug]` |
| `/Users/misaeldessalegn/.cursor/projects/Users-misaeldessalegn-affiliate-marketplace/assets/image-53591852-45f8-4629-ae5e-259cdc6193fd.png` | Mobile recommendations grid | `app/(public)/p/[creator]/[slug]` |
| `/Users/misaeldessalegn/.cursor/projects/Users-misaeldessalegn-affiliate-marketplace/assets/image-adab00d6-41b9-4128-858b-210a68c224d1.png` | Desktop product detail layout | `app/(public)/p/[creator]/[slug]` |
| `/Users/misaeldessalegn/.cursor/projects/Users-misaeldessalegn-affiliate-marketplace/assets/image-f47876f9-56c5-4dc7-9aed-2b1cc32d917e.png` | Desktop recommendations grid | `app/(public)/p/[creator]/[slug]` |

## Design direction (from these screens)

- **Layout:** Fixed left sidebar + top search bar; list pages use toolbars + tables + pagination. Storefront uses stacked mobile cards with rounded image + pill CTAs.
- **Accent:** Purple primary (`~#6C4EF6`) with soft lavender tints.
- **Surfaces:** Light gray page (`~#F5F6FB`), white cards, soft radius (~10–12px), light borders.
- **Sidebar:** Brand + search + grouped nav + avatar/role footer, soft active highlight.
- **Tables:** Image + name columns, soft status pills, action icons, pagination.
- **Forms:** Section cards with header divider; labeled inputs; primary purple CTA; secondary outline actions.

## Scope rules when applying this UI

1. Map **structure and visual language** from these screens; map **content** only to features that exist (products, applications, orders, commissions, earnings).
2. Do **not** add reference-only features (Inbox, Promotion, Analytics Report, payment-by-card chrome) unless product scope expands.
3. Keep architecture invariants (manual COD fulfillment, commission rules, auth roles).
4. Before coding the restyle, update `context/design-system.md` and `context/ui-context.md` tokens to match this teal system so components do not hardcode hex.

## How to use in the next session

1. Read this README + open the relevant PNG for the page being built.
2. Update tokens in `design-system.md` / `ui-context.md` / `globals.css` if not already done.
3. Restyle one surface at a time (sidebar shell → overview → products list → product form → orders → …).
