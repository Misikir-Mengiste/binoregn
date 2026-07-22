# UI Context

This file documents how the tokens in `context/design-system.md`
are wired into Tailwind v4 and shadcn/ui. `design-system.md` is
the source of truth for the design itself; this file is the
technical realization of it.

## Visual references

- **Current target:** `context/ui-resources/` — SadaxCart Figma
  screens. See `context/ui-resources/README.md`.
- **Supplemental inspiration:** Tailwind CSS docs aesthetic for
  invoice layouts (clean spacing, neutral tables),
  [tailwindcss.com](https://tailwindcss.com/).
- **Legacy:** `context/ui-design-system.jpeg` (violet/pink). History
  only.

## Theme

Light only. No dark mode.

## Colors

All tokens are defined once in `app/globals.css` (`:root`), then
exposed to Tailwind as `--color-*` theme keys. Prefer
`bg-teal-600` / `bg-primary` over hardcoding hex. Legacy
`violet-*` / `pink-*` utilities alias to teal for older JSX.

| Role | CSS Variable | Value |
| ---- | ------------ | ----- |
| Page background | `--surface-100` / `--background` | `#F4F7F6` |
| Card / surface | `--surface-0` / `--card` | `#FFFFFF` |
| Primary text | `--ink-900` / `--foreground` | `#1E1B2E` |
| Secondary text | `--ink-600` | `#5A5770` |
| Muted text | `--ink-400` / `--muted-foreground` | `#9A97AC` |
| Primary accent | `--teal-600` / `--primary` | `#00A389` |
| Border | `--border` | `#E5E9E8` |
| Error / destructive | `--coral-500` / `--destructive` | `#F14C4C` |
| Success | `--mint-500` | `#3BB273` |

## Typography

| Role | Font | Variable |
| ---- | ---- | -------- |
| UI text | 'Segoe UI', Inter, -apple-system, sans-serif | `--font-sans` |

## Border Radius

| Context | Class | Value |
| ------- | ----- | ----- |
| Inputs, buttons | `rounded-sm` | 8px |
| Cards / tables | `rounded-md` | 12px |
| Large panels | `rounded-lg` | 16px |
| Badges, search | `rounded-pill` | 999px |

## Component Library

shadcn/ui (style: `base-nova`, Base UI, CSS-variable theming) on
Tailwind CSS v4. Components live in `components/ui/`. Add with
`npx shadcn add <component>`. `components/ui/*` is protected.

## Layout Patterns

- **Admin / creator shell:** full-height left sidebar (white) +
  main content on `--surface-100`. Active nav: teal-100 bg +
  teal-700 text. User identity + sign-out in sidebar footer.
- **List pages:** H1 + subtitle · primary CTA · KPI row · search/
  filters · white table/card body.
- **Public storefront** (`/p/[creator]/[slug]`, built 2026-07-19): no
  sidebar. Simple centered brand header (no nav), then a two-column
  product-showcase + checkout-form layout on desktop, stacking on
  mobile. Same card/radius/shadow tokens as admin/creator, no
  dashboard chrome (no KPI strip, no breadcrumbs — nothing
  admin-specific applies to a buyer-facing page).

## Icons

Lucide React. Stroke-based. Sizes: `h-4 w-4` inline, `h-5 w-5` in
buttons.
