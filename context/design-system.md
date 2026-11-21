# Affiliate Marketplace — Design System

Derived from the SadaxCart Figma dashboard screens in
`context/ui-resources/`. Teal primary, light gray page, white
cards, soft status pills. Adapted for the creator affiliate
marketplace (commission badges, application/order/commission
status states). Do not invent reference-only features (Inbox,
stock, card payments).

---

## Color

Brand sheet (2026-11-11): **#0CB587** green, **#E4F5FF** light blue,
**#B9EEBA** light green, **#070707** black, **#B2B50C** olive,
**#B5200C** red. Token names are kept from the earlier palette so every
existing class picks the brand up; "derived" values are darker/lighter
steps of a brand colour for hover states and readable small text.

| Token | Hex | Usage |
|---|---|---|
| `--teal-600` | `#0CB587` | Brand green — primary, CTAs, active accents |
| `--teal-700` | `#09996F` | Derived — hover / pressed, text on tints |
| `--teal-500` | `#3CC89F` | Derived — secondary accents, charts |
| `--teal-100` | `#E3F7EF` | Derived — soft backgrounds, active nav bg |
| `--coral-500` | `#B5200C` | Brand red — error, "Rejected" / cancelled |
| `--coral-100` | `#FBE6E2` | Derived — soft red background |
| `--mint-500` | `#0E8F55` | Derived — readable success text |
| `--mint-200` | `#B9EEBA` | Brand light green — accents, logo dots on green |
| `--mint-100` | `#E6F9E6` | Derived — success / COD pill background |
| `--peach-100` | `#F4F5D4` | Derived — "Pending" status background |
| `--peach-700` | `#6C6E06` | Derived — "Pending" status text (olive) |
| `--orange-500` | `#A2A50A` | Brand olive, one step darker for text |
| `--blue-100` | `#E4F5FF` | Brand light blue — info tints |
| `--blue-700` | `#1C6FA8` | Derived — info text, charts |
| `--ink-900` | `#070707` | Brand black — primary text |
| `--ink-600` | `#4A524E` | Secondary text |
| `--ink-400` | `#8A928E` | Muted text, placeholders |
| `--surface-0` | `#FFFFFF` | Card / sidebar surfaces |
| `--surface-100` | `#F1F9FD` | Page background (lighter #E4F5FF) |
| `--border` | `#E1EBEF` | Hairline borders |

Legacy aliases (map to teal so older class names still resolve):
`--violet-600` → `--teal-600`, `--violet-700` → `--teal-700`,
`--violet-500` → `--teal-500`, `--violet-100` → `--teal-100`,
`--pink-500` → `--teal-500`, `--pink-100` → `--teal-100`.

---

## Typography

Brand fonts: **Lufga** (headings) & **Inter**, weights Regular / Medium /
Semibold only — `--font-weight-bold` is 600, so `font-bold` renders
Semibold. Lufga is a licensed font not in the repo, so everything uses
Inter (`next/font/google`) until its files are added. Stack:
`Inter, -apple-system, 'Segoe UI', sans-serif`

| Role | Size | Weight | Example |
|---|---|---|---|
| Display | 36px | 700 | `2,450 Birr` |
| H1 | 24px | 700 | `Products List` |
| H2 | 18px | 600 | `Recent Orders` |
| Body | 14px | 400 | `Here you can find all of your products.` |
| Caption | 12px | 400 | `last 365 days` |

---

## Logo & layout

- Logo: `components/logo.tsx` → `public/brand/logo.png` (charcoal) and
  `public/brand/logo-white.png` (white letters, #B9EEBA dots, for green
  or dark backgrounds). Both are the brand artwork
  (`public/binoregn-logo.png`) trimmed and scaled to 600px (~11 KB).
  Size by height (`h-5`–`h-8`).
- Every page shows the logo: landing header/footer, sign-in,
  onboarding/pending cards, dashboard sidebars + mobile headers, buyer
  page header (not a link), invoice.
- Max content width: buyer pages and landing `max-w-5xl` (1024px);
  dashboard content `max-w-[1120px]`.
- Product gallery: native scroll-snap carousel (swipe/trackpad), dots on
  phones, arrows + "n / N" from `sm`, thumbnails, arrow keys.
- Collapsible sections animate height with grid-rows 0fr↔1fr (300ms);
  "See more" animates max-height to the measured content height; both
  honour prefers-reduced-motion.

## Shape & Elevation

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Inputs, small controls |
| `--radius-md` | 12px | Cards, table containers |
| `--radius-lg` | 16px | Large panels |
| `--radius-pill` | 999px | Status badges, search inputs |
| `--shadow-card` | `0 1px 3px rgba(30,27,46,0.06), 0 4px 16px rgba(30,27,46,0.04)` | Cards / tables |
| `--shadow-hover` | `0 8px 24px rgba(30,27,46,0.10)` | Hover elevation |

---

## Buttons

| Variant | Style | Use for |
|---|---|---|
| Primary | Solid `--teal-600`, white text, `rounded-sm` | Main actions: "Add Product", "Approve" |
| Secondary | `--teal-100` background, `--teal-700` text | Supporting actions |
| Outline | White bg, 1px `--border` | Neutral: "Details", "More Actions" |
| Ghost | No background, muted text | Cancel / low emphasis |

---

## Status Badges

Soft pills with tinted backgrounds (not solid fills).

**Application status**
| Status | Background | Text color |
|---|---|---|
| Pending | `--peach-100` | `--peach-700` |
| Approved | `--mint-100` | `--mint-500` |
| Rejected | `--coral-100` | `--coral-500` |

**Delivery / commission**
| Delivery | Cash reconciled? | Commission | Badge notes |
|---|---|---|---|
| Placed | — | None | Muted delivery badge |
| Delivered | Not yet | None | Mint delivery; neutral "Awaiting cash" |
| Delivered | Reconciled | Pending | Mint delivery; peach commission |
| Delivered | Reconciled | Paid | Mint delivery; teal-100 / teal-700 commission |
| Cancelled / Returned | — | None | Coral |

---

## Components

### Admin shell (Sadax)
- Full-height left sidebar on `--surface-0`, page on `--surface-100`
- Sidebar: brand mark (teal circle), optional search, grouped nav, avatar + role footer
- Active nav: `--teal-100` background + `--teal-700` text (no left accent bar required)
- List pages: breadcrumb optional · H1 + subtitle · primary CTA · KPI row · filter toolbar · table card · pagination when needed

### KPI strip (admin list / overview)
- One white card with vertical dividers (not four separate cards)
- Label · large value with short accent bar to the right · caption
  `"{Label} last 365 days"`
- Accents: teal / orange / mint / coral

### Data table
- White card wrapping table; header row muted caption text
- Rows: thumbnail + primary/secondary text; soft status pills; Outline "Details"/action + optional ⋮

### Product form
- Two-column grid of section cards (Name & Description, Pricing, Images)
- Card header with bottom divider; labeled inputs; dashed upload slot in teal tint

### Product card (creator catalog)
- Thumbnail 140px; name 13.5px/600; price 14px/700
- Commission badge: teal-100 / teal-700 pill — **only after approval**; else "Apply to earn commission" CTA

### Invoice (admin + creator)
- Tailwind CSS-inspired: clean typography, neutral tables, generous spacing.
- Centered `max-w` panel with `rounded-lg`, `border`, `shadow-card` on white.
- Header row: brand mark + "Invoice" metadata (invoice number, order date, status).
- Two-column detail grid: "Billed to" + "Order details" (payment is COD).
- Line-item table: soft header background, clear totals block on right.
- Print behavior: hide action buttons with `print:hidden`, drop shadows/borders in print.

---

## Interaction rules that affect UI (not just visuals)

- Commission amount is a **conditional element** — only after admin approval of that creator+product pair.
- Order status and commission status are **separate fields and separate badges**.
- Admin actions (approve/reject, mark delivered, mark paid) are **explicit manual buttons**, not automated.
