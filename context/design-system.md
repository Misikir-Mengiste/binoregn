# Affiliate Marketplace — Design System

Derived from the SadaxCart Figma dashboard screens in
`context/ui-resources/`. Teal primary, light gray page, white
cards, soft status pills. Adapted for the creator affiliate
marketplace (commission badges, application/order/commission
status states). Do not invent reference-only features (Inbox,
stock, card payments).

---

## Color

| Token | Hex | Usage |
|---|---|---|
| `--teal-600` | `#00A389` | Primary brand, CTAs, active accents |
| `--teal-700` | `#008F78` | Primary hover / pressed |
| `--teal-500` | `#2EB6A1` | Secondary accents, charts |
| `--teal-100` | `#E6F7F4` | Soft backgrounds, active nav bg |
| `--coral-500` | `#F14C4C` | Error, "Rejected" / cancelled |
| `--coral-100` | `#FDE7E7` | Soft coral background |
| `--mint-500` | `#3BB273` | "Delivered" / "Approved" / success |
| `--mint-100` | `#E1F6E9` | Soft mint background |
| `--peach-100` | `#FDEEDC` | "Pending" status background |
| `--peach-700` | `#B8620A` | "Pending" status text |
| `--orange-500` | `#F5A524` | Attention / "new orders" accent |
| `--blue-100` | `#E8F1FB` | "Completed"-style soft badge bg |
| `--blue-700` | `#2F6FED` | "Completed"-style badge text |
| `--ink-900` | `#1E1B2E` | Primary text |
| `--ink-600` | `#5A5770` | Secondary text |
| `--ink-400` | `#9A97AC` | Muted text, placeholders |
| `--surface-0` | `#FFFFFF` | Card / sidebar surfaces |
| `--surface-100` | `#F4F7F6` | Page background |
| `--border` | `#E5E9E8` | Hairline borders |

Legacy aliases (map to teal so older class names still resolve):
`--violet-600` → `--teal-600`, `--violet-700` → `--teal-700`,
`--violet-500` → `--teal-500`, `--violet-100` → `--teal-100`,
`--pink-500` → `--teal-500`, `--pink-100` → `--teal-100`.

---

## Typography

Font stack: `'Segoe UI', Inter, -apple-system, sans-serif`

| Role | Size | Weight | Example |
|---|---|---|---|
| Display | 36px | 700 | `2,450 Birr` |
| H1 | 24px | 700 | `Products List` |
| H2 | 18px | 600 | `Recent Orders` |
| Body | 14px | 400 | `Here you can find all of your products.` |
| Caption | 12px | 400 | `last 365 days` |

---

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

---

## Interaction rules that affect UI (not just visuals)

- Commission amount is a **conditional element** — only after admin approval of that creator+product pair.
- Order status and commission status are **separate fields and separate badges**.
- Admin actions (approve/reject, mark delivered, mark paid) are **explicit manual buttons**, not automated.
