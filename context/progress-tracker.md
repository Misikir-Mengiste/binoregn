# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- **2026-11-11 — Feature update list (user-supplied), decisions +
  build order.** Source: the user's "update lists" brief. Decisions
  confirmed with the user before any code:
  1. **Creator product page** — creators see the same product design
     buyers see, plus a commission badge ("You earn X Birr per
     delivered sale"). No quantity / Buy Now; one button that walks
     Request to Promote → Waiting for Approval → Copy Link + Share,
     or Not Approved when rejected.
  2. **Re-request** — a creator may request the same product again 7
     days after a rejection (reuses the one Application row per
     creator+product; `@@unique([creatorId, productId])` stays).
  3. **Creator limit per product** — admin sets `maxCreators` per
     product (empty = unlimited). Only APPROVED creators use a spot;
     pending requests don't, but admin can't approve once full.
     Creators see spots left; the button shows "Full" at 0.
  4. **Order confirmation is on-screen only** with the order number.
     The optional buyer email field and tracking email are removed.
  5. **Payouts every Friday** replace creator withdrawal requests.
     Delivered → commission PENDING again (reverses the 2026-07-29
     auto-PAID decision). The Friday list covers PENDING commissions
     created by Thursday 11:59 PM (Africa/Addis_Ababa, UTC+3), only
     for creators whose eligible total is ≥ 500 Birr; smaller amounts
     roll over. Admin downloads the list as an Excel file from the
     dashboard and marks it paid. Not launched yet (confirmed), so
     legacy test data is converted in a migration rather than
     carried over with exact accounting.
  6. **Notifications** — stored per creator (dashboard) and also sent
     on Telegram: profile approved/rejected, product request
     approved/rejected, order delivered, commission added, commission
     paid, admin announcements. Admin Telegram bot alerts: new order,
     new creator signup, new product request, low/out-of-stock, payouts
     due. Friday Telegram reminder ("Payout day: N creators · X Birr")
     only when someone reached 500 Birr; no daily summary. Telegram
     never sends the Excel file.
  7. **Trust/speed** — mobile-first, compressed images, "Cash on
     delivery" clearly shown, visible contact info, HTTPS everywhere
     (HTTPS itself is a server/proxy concern, not app code).
  Background work (Telegram, Friday reminder) needs a scheduler —
  this changes architecture.md's "Background: none"; updated in the
  unit that adds it. Build order: (a) creator product page +
  re-request + spot limit, (b) screen-only confirmation, (c) Friday
  payouts + Excel + withdrawal removal, (d) stored notifications +
  announcements, (e) Telegram bot, (f) image compression + trust
  details.

- **2026-11-12 — Orders table + dashboard background.** Orders table: Delivery and Payment columns replaced by one Fulfillment column (order stage pill); product names cut to 24 chars with the full name as a tooltip; even cell padding (20px edges, 12px between) via row-level classes; table min width 760px; responsive title/stat sizes. Admin + creator dashboards: white content area, sidebars on a new light-grey token `--surface-50` (#f8f9fa) with a white bordered active item and white hover (user reference). Shared PageHeader title 22px on phones, 28px from sm. Verified no horizontal overflow on every admin and creator page at 375/768/1280.

- **2026-11-23 — Payout methods as one logo list.** Creators pick one payout
  option from the admin list (banks + wallets together) shown as logo tiles
  (`components/payout-method-picker.tsx`) in sign-up step 3 and Settings:
  wallets (Telebirr…) ask account holder name + phone (+251, leading 0 ok);
  banks (CBE…) ask name + account number. Server check:
  `lib/payout-choice.ts` (API body `payoutOptionId`, `payoutAccountName`,
  `payoutAccountNumber`); saved as payoutBankName = option name for both
  kinds, payoutMethod = TELEBIRR (wallet) / BANK_TRANSFER (bank). Displays
  use `lib/payout-display.ts` `payoutProvider()` (admin commissions,
  creator page, payouts list/history, Excel: Payout method / Type /
  Account or phone, payout-sent message, earnings, change alert).
  `PayoutOption.logoUrl` (migration `20261123120000_payout_option_logo`);
  admin Settings: Upload/Change/Remove logo per method (rows now update in
  place — also fixes Activate/Deactivate not redrawing). Built-in logos:
  `public/images/payout-methods/telebirr.webp`, `cbe.webp`. Removed unused
  `payout-method-form.tsx` and `lib/validations/payout.ts`. Tested end to end.

- **2026-11-23 — Social media: profile link instead of @username.** The
  field is "Social media profile link" again (`lib/profile-link.ts`, replaces
  `lib/social-handle.ts`): a real http(s) link; "https://" added if typed
  without (tiktok.com/@x → https://tiktok.com/@x); a bare @username gets
  "paste the full link". Same rule in sign-up, Settings and the API; admin
  creator page shows it as a clickable "Profile link".

- **2026-11-23 — Sign-up form checks + @username + sign-in only.** The
  4-step creator form checks each step on Continue (red message under each
  missing/wrong field, focus first; re-checked on submit): name, username,
  phone (9 digits after +251, leading 0 dropped); display name, platform,
  social media, category; Telebirr phone or bank/name/account number.
  "Profile URL" → "Social media username": must start with @
  (`lib/social-handle.ts`; letters/numbers/._- ; links rejected) in the form,
  Settings and the API (column `creatorProfileUrl` kept); admin creator page
  links it per platform. Home page Get started/Create account → /sign-in;
  sign-in page has no sign-up link (a new email/Google account is created
  on first sign-in). Tested end to end in the browser.

- **2026-11-23 — Commission × quantity.** A delivered order now earns the
  creator `commissionBirr × quantity` (was one commission per order
  regardless of items). Admin order page shows the multiplied amount (and
  "800 × 3"); request-approved message says "for every item delivered".
  Tested locally: 3 items × 800 → 2,400.

- **2026-11-22 — Production deploy (Contabo Cloud VPS 4, 62.169.29.172).**
  Ubuntu 24.04, Node 22, PostgreSQL 16 (localhost only, fresh DB + admin
  binoregn@gmail.com), nginx + Let's Encrypt (auto-renew tested), ufw
  22/80/443, app user `binoregn`, PM2 on boot (127.0.0.1:4000), nightly
  backups + pre-deploy backups, Friday reminder cron, Telegram webhook on
  https://binoregn.com, www→apex redirect. DNS A records moved from the old
  server (149.102.140.160). Deploy: push to `vps` remote + `deploy/deploy.sh`
  (doc/deploy.md). Verified: pages, access rules, dev OTP bypass off, SMTP
  login from server, Google sign-in working (2 users signed in).

- **2026-11-21 — Full health check + admin data-leak fix.** Scripted check
  (99 checks, real sign-in flow as admin/creator/buyer, test data only):
  auth, access control, every page, buyer order + discount, order
  statuses/locks, commission at delivery only (full amount), stock, cancel,
  products (publish toggle keeps data), applications approve/reject + 7-day
  re-request, creator limit, short links, payouts + Excel, deactivate/
  reactivate, uploads, cron/webhook secrets, announcements, emails. All 29
  pages checked at 375px: no overflow, no console/hydration errors.
  **Fixed:** signed-in creators opening /admin/* got the "no access" message
  but the page data (buyer names, phones) was still in the response — added
  `requireAdminPage()` to all 12 admin pages + layout redirect. Lint now 0
  warnings. Real data verified unchanged (before/after counts identical).

- **2026-11-21 — Creator discount codes.** Product: `discountEnabled`,
  `discountBirr`, `discountCode`; Order: `discountBirr` (default 0),
  `discountCode` (migration `20261121150000_discount_codes`). Admin product
  form "Creator Discount Code" card (switch, ETB off, code). Buyer page shows
  "Have a creator code? Save N ETB at checkout" (no code); checkout has a
  code field + Apply (strike-through old total, new total, Remove).
  Approved creators see the code with Copy on their product page; others see
  "you'll get the code once approved". Fixed amount once per order; full
  commission. Totals everywhere via `orderTotalBirr()`. Tested: save rules,
  code never in buyer/unapproved-creator page data, wrong/right/case codes,
  qty 2 → 4,000 → 3,500, stored on order, commission stays 150, off → hint
  gone + code rejected + values kept, admin list/detail/invoice/tracking/
  email totals, mobile layout. Discount code field moved to the top of the
  checkout (right under the product/price row, above Full Name).

- **2026-11-21 — Google sign-in configured (local).** Google Cloud OAuth
  client (Web) with origins `http://localhost:4000` + `https://binoregn.com`
  and redirect URIs `…/api/auth/callback/google` for both. Keys in local
  `.env` (`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`). Checked: provider loads,
  Google shows "Sign in to continue to Binoregn" (no redirect mismatch).
  Not done: a full sign-in; app is in Google "Testing" mode until
  published; production needs the same keys + `AUTH_URL=https://binoregn.com`.
  Google sign-in can't work over LAN IPs (Google rejects private-IP redirects).
  SMTP DKIM enabled in DirectAdmin (`x._domainkey`, 2048-bit, live on public DNS).

- **2026-11-21 — Email now sends from contact@binoregn.com.** Local `.env`
  SMTP switched from Gmail to the domain mailbox (DirectAdmin):
  `mail.binoregn.com:587`, STARTTLS (`SMTP_SECURE=false`),
  `SMTP_FROM="Binoregn <contact@binoregn.com>"`. Verified connect + TLS +
  login (nothing sent). DNS: SPF covers the mail server (via `mx`), DMARC
  `p=none`, **no DKIM record found** — enable DKIM in DirectAdmin to keep
  mail out of spam. Production server needs the same SMTP_* values.

- **2026-11-21 — Tracking link + Copy fixed on phones.** Order
  confirmation Copy used only `navigator.clipboard`, which doesn't exist on
  plain-http pages (phone over LAN / before HTTPS) — it silently did
  nothing. New `lib/clipboard.ts` `copyText()` (clipboard API, else
  textarea + execCommand with the iOS selection step; returns whether it
  worked), used by the confirmation, `CopyButton` and the creator promote
  button. Confirmation Copy → "Copied" (green, check icon) for 2.5s, or
  "Couldn't copy" on failure. Tracking link is now built from
  `window.location.origin` (not the server Host header — wrong behind a
  proxy/HTTPS) and the URL itself opens the tracking page. Tested over
  http://LAN: copies the exact URL, label changes, tracking page loads.

- **2026-11-21 — Phone + Call now on order confirmation.** New
  `SiteSetting` model (migration `20261121120000_site_settings`),
  `lib/site-settings.ts`, `PATCH /api/admin/site-settings` (phone digits
  with optional +, spaces/dashes; can't show without a number). Admin
  Settings → "Phone on order confirmation" card (number, Visible/Hidden
  switch, Save). The checkout success view shows it between order number
  and tracking link; Call now = `tel:` with spaces removed. Tested:
  validation, Settings save, real order on desktop + mobile, hidden →
  not shown. No number is set yet — admin sets it in Settings.

- **2026-11-21 — Username rules.** `lib/username.ts`: must start with a
  letter; letters and underscores, numbers only at the end; no spaces;
  2–60 chars; saved lowercase ("Betty_Picks22" → "betty_picks22").
  Enforced in `creatorOnboardingSchema` (API) and live in the onboarding
  form (typing lowercases and drops spaces, rule/error under the field,
  Continue blocked until valid). Settings uses the new
  `creatorProfileSchema` (no username) — it never changed the username,
  and now existing non-conforming usernames (e.g. "Noh Ananda") can
  still save Settings. The one non-conforming local username ("Noh Ananda")
  was renamed to "noh_ananda" (user approved); all usernames now match.

- **2026-11-21 — Creator email notifications.** Every creator bell
  notification is also emailed (all creators, new and existing). New:
  product paused/available again (bell + email; migration
  `20261121090000_product_availability_notifications`), and email-only
  application received, payout details changed, account deactivated.
  `APP_URL` added to `.env.example` for email links. Tested end to end
  through the dev server with a local SMTP catcher: 17 emails for 17
  events, right recipients, no duplicates on repeat actions. Also fixed a
  pre-existing bug: the admin Products list Publish toggle (PATCH
  `{ isPublished }`) wiped the product's images/colors/sizes/features and
  reset stock to 100 (zod `.partial()` re-applied create defaults) — the
  route now applies only the fields sent.

- **2026-11-12 — Link views once per 24h, commission hardening, phone hydration.**
  Views: `LinkVisit` model (migration `20261112120000_link_visits`), browser
  beacon on `/r/[slug]` → `POST /api/public/links/[slug]/view` ("bv" visitor
  cookie, atomic 24h window); the page no longer counts on every render.
  Tested: same visitor counts once, again only after 24h, 5 parallel = 1,
  page loads without JS (link previews) don't count. Commission: created in
  one transaction (unique per order, atomic stock decrement) — 4 parallel
  Delivered calls → 1 commission, stock deducted once; fulfillment route now
  refuses any status change once a commission exists. Hydration (iPhone):
  `formatDetection` off for phone/date/address/email; all number formatting
  pinned to en-US and dates to `formatDate()` (Addis time, "12 Nov 2026").

- **2026-11-12 — Root <html> hydration warning on phones.** A phone tab
  restored from cache kept the old <html> class (before the Mont font was
  removed) and showed a hydration error. Added `suppressHydrationWarning` to
  <html> in `app/layout.tsx` (covers that element’s own attributes only).

- **2026-11-12 — Creator copy trimmed.** Home payout card shows only
  "Pending payout" + amount (dropped the all-time and Friday/min lines);
  creator product page badge reads "Commission N ETB"; My Links rows show
  the product name only (no per-order earn line).

- **2026-11-12 — Creator stat cards white with icons.**
  `components/creator-stat-card.tsx` is now a white card with a tinted
  icon tile (shared by creator Home, My Links, Applications). My Links:
  Active links, Link views, Delivered orders (renamed from "Total orders"
  — it only counts delivered), + Conversion rate (delivered orders ÷
  views). Applications: Total, Approved, Pending review, + Not approved.

- **2026-11-12 — Product names capped at 15 chars in every table.**
  `lib/short-name.ts` (`shortProductName`, `TABLE_NAME_MAX = 15`, "…"
  included) used by all admin and creator tables (orders, dashboard recent
  orders, products, applications, commissions, creator detail; creator
  links and applications). The full name stays in a `title` tooltip and
  on detail pages, cards and invoices.

- **2026-11-12 — Admin orders redesign + order detail/edit (user design reference).**
  `app/admin/orders`: header with Export (CSV with BOM, opens in Excel);
  toolbar with search (name/phone/order #), Filter by stage, Sort
  (newest/oldest/total), Show Statistics toggle (remembered per
  browser), "Last update" + refresh; four stat cards (Total, Cancelled,
  Pending, Returned) with this-month-vs-last-month % (Addis time) and a
  30-day trend line, all from real data; table (checkbox, order #, date,
  customer + phone, product + options, Delivery stage, items, total,
  Payment = cash reconciled, ⋮ menu: view/edit, invoice, delete); bulk bar
  (export selected, update status → processing/shipped/delivered/
  cancelled, delete); pagination (10/20/50, page numbers with gaps, go to
  page). "Create Order" from the reference left out — orders only come
  from creator links (attribution). Rows open `/admin/orders/[id]`: item
  card, editable customer & delivery form (name, 10-digit phone, city,
  address, notes; quantity/colour/size only while PLACED), status
  stepper (forward/back until delivered; cancel/return), payment card,
  creator + commission card, timeline. New `PATCH /api/admin/orders/[id]`
  (`updateOrderSchema`): contact fields always editable; item fields
  409 unless PLACED; colour/size must be product options; attribution
  never editable; status changes stay on the existing routes. Verified
  with 14 DB-inserted test orders (no alerts sent; all removed, stock
  restored): search/filter/sort/paging, bulk ship/delete, detail edit +
  save, processing, payment, deliver → commission + lock, API 409/400s,
  no overflow at 375/768/1280. Build currently fails only on the user's
  in-progress `Mont` import in app/layout.tsx.

- **2026-11-11 — Trust badges, phone rule, bar fix, creator Telegram removed.**
  Product page: the Delivery Options card is removed. Under Buy Now are
  four badges from the new `Product.trustBadges String[]` (migration
  `20261111140000_product_trust_badges`, DB default = "Free Delivery",
  "Delivered within 2 hours", "Same day return", "Nothing to pay before
  delivery" — also in `lib/product-badges.ts`); icons by position; empty
  entries hidden; 2×2 on phones, 4 across from sm. Admin product form:
  "Delivery Options" section replaced by "Badges under Buy Now" (four
  inputs, defaults pre-filled; validation requires exactly 4, ≤ 40 chars).
  The old discount/delivery-time/returns fields are still stored but no
  longer shown anywhere. Checkout phone: exactly 10 digits, numbers only
  (input strips non-digits, pattern + "N more digits" hint; server
  `/^\d{10}$/` in lib/validations/order.ts). Bottom white space: removed
  the footer padding added for the mobile bar; the bar now also hides
  when the footer is on screen. Creators no longer get Telegram messages
  (lib/notifications.ts saves dashboard notifications only;
  `sendTelegramToCreators` removed; Connect Telegram removed from creator
  settings; `/api/telegram/link` admin-only). Admin alerts unchanged.
  Dev fix: `experimental.turbopackFileSystemCacheForDev: false` — the
  Turbopack dev cache went stale a third time (nested dynamic API routes
  404 after restarts). Verified on 375px via LAN: no Delivery Options,
  2×2 badges, no gap under footer, bar hidden at footer; phone filtering /
  hint / validity and API 400s; admin add form defaults; badge edit shows
  on page, wrong count → 400, defaults restored; build passes.

- **2026-11-11 — One-step checkout modal (user design reference).**
  The 2-step checkout is replaced by one form
  (`app/(public)/r/_components/checkout-form.tsx`) styled after the
  user's reference: "Please fill in the form to order" + close, product
  row (image with quantity badge, name, colour / size, adjustable
  quantity, line price), icon-box fields Full Name*, Phone*, City*
  (select), Address*, Notes (optional) — all old fields kept — small
  delivery notes (free delivery in Addis only; arrival within 3 hours if
  ordered 2:00 AM–11:00 AM LT; pay on receipt; Telebirr and CBE only) and
  a "Confirm to Delivery" button. No subtotal/total (user request).
  Buy Now / Add to Cart / the mobile bar open it as a modal
  (`checkout-modal.tsx`: bottom sheet on phones, centred 460px dialog
  from sm, portalled, scroll lock, Esc/backdrop close); quantity edits
  sync back to the product page. The links still point to
  `/r/[slug]/order`, now a single centred card with the same form
  (qty/colour/size from the query string). Confirmation text changed
  from "Pay cash when your order arrives" to "Pay when your order
  arrives" (the same modal now says Telebirr/CBE only). Verified: modal
  fields/notes/button at 375px via LAN, real order placed and stored
  with all fields (deleted afterwards), Done/Esc close + scroll unlock,
  desktop dialog centred, fallback page with qty=2, build passes.

- **2026-11-11 — Product page: whitish look, image viewer, sticky buy bar.**
  Backdrop toned to white with faint brand tints; cards are near-solid
  white with hairline borders (header/footer too). Tapping a main image
  opens a full-screen viewer (`ImageViewer` in product-gallery.tsx:
  portalled to body, object-contain, swipe/arrows/keys, Esc/✕/backdrop
  close, scroll lock). Quantity stepper and Buy Now share one row; a trust
  row under it shows delivery time, returns (same values as Delivery
  Options) and "Nothing to pay before delivery". Phones get a pop-up
  Buy Now bar (total, stepper, Buy Now; same qty/colour/size) that slides
  up once scrolling starts while the inline Buy Now row is off screen;
  visibility is computed from element positions on scroll (an
  IntersectionObserver version never updated in a backgrounded page), and
  the footer gets bottom padding via `body:has([data-buy-bar]) footer`.
  Header badge + footer now say "Mobile Transfer on Delivery" (footer
  subtitle "Pay via mobile transfer when your order arrives."; second
  footer line now "Nothing to pay before delivery"). **Decision (user):**
  only header and footer change — Delivery Options "Payment: Cash on
  Delivery", the checkout button/confirmation and the invoice still say
  cash. Verified at 375/768/1280 (no overflow; qty+Buy Now on one row; bar
  phone-only, shows past the button, hides when it's on screen; footer
  contact not covered); viewer open/swipe/close; build passes.

- **2026-11-11 — Product descriptions cleaned (user request).**
  `lib/sanitize-html.ts` rewritten as a small tree-based cleaner (same
  safety whitelist): keeps only editor-palette text colours
  (`EDITOR_COLORS`, brand colours) and plain text-align values; flattens a
  list item that only wraps another list (the doubled bullets); drops
  empty elements and attribute-less spans; converts bold font-weight on
  inline-only elements to <strong> (not on section wrappers, which would
  bold whole paragraphs); auto-closes unclosed li/p. Runs on paste in the
  editor, on save (`lib/validations/product.ts` transform) and on render.
  Editor colour buttons now emit inline colour styles (they produced
  `<font>` tags the sanitizer dropped, so colours never showed) and use
  the brand palette. Rich text spaces top-level div sections
  (`[&>div+div]:mt-3`). Existing descriptions cleaned from a backup
  (`backups/product-descriptions-2026-11-11.json`, gitignored):
  XPPen 18,780 → 825 chars, Anker 23,322 → 1,486. Verified: 27 sanitizer
  cases incl. XSS vectors; single bullets on XPPen; Anker sections spaced;
  editor paste cleans live; colour button output survives. Anker's
  feature titles aren't bold — the source only set weight on whole
  sections; bold them in the editor if wanted.

- **2026-11-11 — Product page glass look + phone fix.** Product page
  background is a fixed "white glass" backdrop
  (`components/product/glass-backdrop.tsx`: blurred brand-green /
  light-green / light-blue blobs) with translucent frosted cards
  (collapsibles, recommendation cards, buyer header/footer). Removed the
  "Cash on delivery · pay when it arrives" pill under the price (COD still
  shows in the header chip, Delivery Options and the footer). "More from
  this creator" → "More to Explore" (only shown when the creator has
  other products). "See more" fades the text with a CSS mask instead of a
  white overlay, which showed as a pale band on glass.
  **Phone bug root cause:** the dev server was opened from a phone via
  the PC's LAN IP (192.168.1.121). Next 16 blocks dev resources for
  non-localhost hosts, so the page never hydrated and no toggle worked.
  Fixed with `allowedDevOrigins: ["192.168.*.*"]` in `next.config.ts`
  (dev only; production unaffected). Verified through the LAN address at
  375px: hydrates, Description toggles, See more expands; no horizontal
  overflow at 375/768/1280. Content note: the XPPen description was pasted
  from another site with ~18 KB of inline styles, which causes a doubled
  bullet on its first list.

- **2026-11-11 — Brand refresh + product page polish (user request).**
  Palette and type from the user's brand sheet applied via the existing
  tokens in `app/globals.css` (see design-system.md); `font-bold` → 600;
  Inter is now first in the stack (was Segoe UI). Lufga not added — it's
  a licensed font; needs the user's font files. Chart colours on creator
  dashboards switched to brand colours. Logo: trimmed web versions in
  `public/brand/` (dark + white), `Logo` gained `variant`; logo added
  to landing header/footer, buyer pages (new header in
  `app/(public)/layout.tsx`), onboarding + pending cards, invoice.
  Containers narrowed (buyer/landing `max-w-5xl`, dashboards
  `max-w-[1120px]`). Product gallery is a swipeable scroll-snap carousel;
  Description/Delivery collapsibles and "See more" animate. Verified:
  25 pages × 375/768/1280px with no horizontal overflow (public,
  creator, admin), swipe + thumbnail sync, transitions present (300ms)
  and correct open/closed heights. Not verified: animation smoothness
  by eye (the browser pane was hidden, which pauses CSS animations).

- **2026-11-11 — Telegram verified live.** Bot `@BinoregnNotifyBot`
  (token/username in local `.env`). Real delivery confirmed: admin
  connected via Settings → Connect Telegram through a temporary
  Cloudflare quick tunnel (a local relay exposed only
  `POST /api/telegram/webhook`, since dev accepts the 000000 code), and
  a real new-order alert arrived. Test webhook deleted afterwards, so
  the bot has no webhook until `npm run telegram:webhook -- https://<domain>`
  is run on the deployed site; the admin must reconnect there (separate
  database). Fix found while testing: Node tried api.telegram.org over
  IPv6 first and timed out on this network — `instrumentation.ts` now
  sets `dns.setDefaultResultOrder("ipv4first")` at server start (same
  in `scripts/set-telegram-webhook.ts`).

- **2026-11-11 — Unit (f) done: speed + trust details. All six units
  of the update list are built; `npm run build` passes.** Uploads
  (`POST /api/admin/uploads`) are now auto-rotated, resized to fit
  1600×1600 and re-encoded as WebP q80 with `sharp` (now a direct
  dependency); GIFs kept as-is; raw limit raised 5 → 15 MB since
  output is small (test: 3.8 MB 4000×3000 JPEG → 293 KB 1600×1200
  WebP); undecodable files rejected. Images uploaded before this
  change are not recompressed. Gallery thumbnails and recommendation
  cards lazy-load. "Cash on delivery · pay when it arrives" pill under
  the price on every product page; new `app/(public)/layout.tsx`
  footer on all buyer pages with COD + contact details
  (`lib/site.ts`, `NEXT_PUBLIC_CONTACT_EMAIL` / `_PHONE`).
  `next.config.ts` sends `X-Content-Type-Options`, `Referrer-Policy`
  and, in production only, HSTS. The certificate and http→https
  redirect must be set up on the reverse proxy — not app code. Not
  measured: real load time on a slow mobile connection.
  **Deploy checklist:** `npx prisma migrate deploy` (rewrites link
  codes, converts withdrawals, adds payouts/notifications/Telegram
  columns); fill the new `.env` keys (see `.env.example`); create the
  bot with @BotFather and run `npm run telegram:webhook --
  https://<domain>`; add the Friday cron line from
  `app/api/cron/payout-reminder/route.ts`; HTTPS on the proxy.

- **2026-11-11 — Units (d) + (e) done: stored notifications,
  announcements, Telegram bot.** New models `Notification`,
  `Announcement`, enum `NotificationType`, `CreatorProfileStatus.REJECTED`
  (migration `20261111082708_notifications_and_profile_rejection`) and
  `User.telegramChatId`/`telegramLinkToken` (`20261111083500_user_telegram`,
  written from `prisma migrate diff` because `migrate dev` refuses to
  run non-interactively when it warns about new unique indexes).
  `lib/notifications.ts` (save + Telegram, never throws, HTML-escaped),
  `lib/telegram.ts` (send, admin alerts, auto-unlink on 403),
  `lib/order-events.ts` (`afterOrderDelivered`: creator message +
  low/out-of-stock alert; called by the delivery, fulfillment and
  cash-reconciled routes when a commission was created). Triggers:
  profile approve/reject (`PATCH /api/admin/creators/[id]/approve` now
  takes `{ decision }`), request approve/reject, order delivered,
  payout paid, announcements (`/admin/announcements` +
  `POST /api/admin/announcements`). Creator bell reads stored rows and
  marks them read via `POST /api/creator/notifications/read` (replaces
  the localStorage "seen" list). Admin alerts on Telegram: new order,
  creator signup, product request, stock, Friday reminder
  (`GET /api/cron/payout-reminder`). Telegram linking:
  `/api/telegram/link`, `/api/telegram/webhook`,
  `components/telegram-connect.tsx` on creator + admin settings,
  `npm run telegram:webhook -- https://domain`. `lib/site.ts` holds
  public contact details. Verified locally: every trigger saved the
  right notification (profile reject, request approve, delivered with
  order number + commission, payout paid), bell + read endpoint,
  rejected creator's pending page, announcement to 3 creators (test
  rows deleted afterwards), webhook secret/403, private-chat-only,
  one-time token, chat moved between accounts, /stop, cron auth +
  Friday guard. **Not verified: real Telegram delivery** (no bot token
  yet). Dev note: Turbopack's dev filesystem cache sometimes keeps a
  stale route list across restarts (new or nested routes 404); deleting
  `.next/dev` fixes it. Production builds don't use that cache.

- **2026-11-11 — Unit (c) done: Friday payouts replace withdrawals.**
  `lib/commission/index.ts` now creates commissions PENDING (the
  single-commission `markCommissionPaid` and
  `PATCH /api/admin/commissions/[id]/pay` are gone).
  `lib/commission/payouts.ts`: `payoutCutoff` (latest Thursday
  23:59:59.999 Addis time), `upcomingPayoutCutoff` (creator-facing:
  the Friday that's today or ahead), `getDuePayouts` (live, ≥ 500
  Birr), `markPayoutPaid` (one transaction; conditional updateMany
  refuses double-payment). New `Payout` model + `Commission.payoutId`;
  `Withdrawal` + `WithdrawalStatus` dropped in migration
  `20261111081224_friday_payouts`, which first converts legacy data
  (oldest PAID commissions covered by approved withdrawals stay PAID
  under one legacy Payout; the rest go back to PENDING — tested in a
  rolled-back transaction). Admin: `app/admin/payouts` (KPIs, ready-
  to-pay table with payout details, Mark paid / Mark all paid with
  confirm, recent payouts) + `GET/POST /api/admin/payouts` +
  `GET /api/admin/payouts/export` (Excel via `exceljs`, account
  numbers as text). Sidebar "Withdrawals" → "Payouts"; admin bell
  shows "Payouts due: N creators · X Birr". Admin commissions page
  says "Paid on Friday" instead of a Mark paid button. Creator
  earnings/home pages show next payout + "How payouts work" instead
  of the withdrawal form; history lists Friday payouts. Admin creator
  detail shows "Due this Friday" and payout history. Verified: cutoff
  unit cases (incl. Fri 00:30 Addis = Thu UTC, exactly 11:59:59.999
  PM), due list includes the 11:59 PM commission and excludes 12:00:01
  AM and a 300 Birr creator, Excel contents, mark paid → 4 commissions
  PAID + Payout snapshot, second attempt "Nothing due", future cutoff
  rejected, marking an order Delivered via the admin API → PENDING
  commission.

- **2026-11-11 — Unit (b) done: on-screen-only order confirmation.**
  Buyer email field, `buyerEmail` validation, and the tracking email
  (`sendOrderTrackingEmail`) removed; the `Order.buyerEmail` column
  stays (nullable, older orders). Confirmation shows "Order number:
  #XXXXXXXX" and the tracking link. `lib/order-number.ts` is now the
  single order-number format (last 8 chars of the id, uppercase) —
  admin orders/commissions/invoice previously showed the first 8–10
  chars, which share a timestamp prefix and didn't match what buyers
  see.

- **2026-11-11 — Unit (a) done: creator product page, re-request,
  creator limit.** Buyer product layout extracted to
  `components/product/product-showcase.tsx` (+ gallery/collapsible
  card moved to `components/product/`), used by both
  `app/(public)/r/[slug]` and the new `app/creator/products/[id]`
  page. Creator page adds the commission badge, "N of M spots left",
  and `promote-button.tsx` (Request to Promote → Waiting for Approval →
  Copy Link + Share / Not Approved with re-request date / Full). State
  logic lives in `lib/promotion.ts` (`promoteState`, `spotsLeft`,
  `REREQUEST_AFTER_DAYS = 7`). Catalog cards now open the product
  page (old preview drawer and card Apply button removed) and show the
  same state labels; sidebar search links to the product page.
  `Product.maxCreators Int?` (migration
  `20261111080221_product_max_creators`), editable as "Creator limit"
  in the admin product form. `POST /api/creator/applications` now
  rejects hidden products, enforces the 7-day wait and the limit, and
  upserts so a rejected (or admin soft-deleted) row is reset to
  PENDING. Admin approve refuses when full and reuses an existing
  link for the same creator+product instead of minting a second.
  Known gap: two simultaneous admin approvals on the last spot could
  both succeed (no row lock) — acceptable for a single admin.
  Verified locally in the browser (catalog "Full", request → waiting,
  reject → date shown + API 409, re-request after 8 days, admin
  approve → Copy/Share, full-product approve → 409, mobile layout,
  public `/r/` page unchanged with no commission shown).

- **2026-11-10 — Short affiliate links: `/r/[code]` replaces
  `/p/[creator]/[slug]`.** Requested by the user: links were long
  (`/p/<username>/<25-char cuid>`) and, for creators without a
  username, leaked their email local-part into a public URL. New
  format is `/r/<7-char base62 code>`, e.g. `/r/uytYfM6`.
  **Decision (confirmed with the user): old `/p/...` URLs are removed
  outright and now 404 — no redirect.** Anything creators already
  posted with the old format stops working.
  Implementation: the code lives in the existing `AffiliateLink.slug`
  column (not renamed — `affiliateLinkSlug` stays the name everywhere
  in APIs/checkout). `@default(cuid())` was dropped so the slug must be
  set explicitly; it's generated by `lib/affiliate-link-code.ts`
  (`node:crypto` `randomInt`, 62^7 ≈ 3.5T combinations) in
  `PATCH /api/admin/applications/[id]` on approval, retrying up to 3
  times on a P2002 unique collision. Migration
  `20261110000000_short_affiliate_link_codes` rewrites every existing
  slug to a fresh unique 7-char code (plpgsql loop, same alphabet).
  `lib/affiliate-link-path.ts` is the single place the URL is built
  (`/r/${code}`), split from the generator so client components can
  import it without `node:crypto`. Pages moved
  `app/(public)/p/[creator]/[slug]` → `app/(public)/r/[slug]`
  (+ `/order`); the creator Links page and product catalog copy
  buttons no longer fetch or use a creator username. Verified end to
  end locally: admin approval → 7-char code; `/r/<code>` and
  `/r/<code>/order` render; recommendation cards link to `/r/...`;
  checkout through the code attributes the order to the right
  creator; copy buttons copy `/r/<code>`; old `/p/...` and unknown
  codes 404. `npm run build` passes.
  **Deploy note:** run `npx prisma migrate deploy` on the server — it
  rewrites all production link codes.

- **2026-07-29 — Product publish/unpublish + stock, with auto-hide on
  0 stock.** New concept, didn't exist before: `Product.stock` (Int,
  `@default(100)` — the default only matters for the migration
  backfill on pre-existing rows, so they don't all read as
  out-of-stock the moment the column appears) and
  `Product.isPublished` (Boolean, `@default(true)`) added via
  migration `20260728210735_add_product_stock_and_published`.
  Design: visibility is *computed at read time* as `isPublished &&
  stock > 0` everywhere a product is shown to a creator or the
  public — there's no separate "auto-unpublished" state ever
  written. This was a deliberate choice over toggling `isPublished`
  off when stock hits 0: it means raising stock back above 0 makes
  the product reappear immediately with zero extra logic, and a
  manual unpublish (stock still positive) can never get silently
  clobbered by a later stock change, since the two fields are never
  cross-written. Confirmed with the user before building: stock
  decrements by `Order.quantity` only when an order reaches
  Delivered (not at checkout — a placed order can still be
  cancelled/returned before then), and admin raising stock back up
  must bring the product back into the creator catalog and public
  page automatically (satisfied for free by the read-time formula
  above). Where this landed: (1) `lib/commission/index.ts`'s
  `maybeCreateCommission` — already the single idempotent
  "just-became-Delivered" trigger point (guarded by "no Commission
  row yet") — now also decrements `product.stock` by
  `order.quantity` (floored at 0) in the same pass, since both are
  gated by the identical one-time event; renamed nothing, just
  extended the function and its comment. (2)
  `lib/validations/product.ts` — `createProductSchema` gained
  `stock` and `isPublished`; `updateProductSchema` is still just
  `.partial()` of it, so `PATCH /api/admin/products/[id]` needed
  zero route changes to support `{ isPublished: false }` or `{
  stock: N }` calls. (3) Visibility filters added: `app/creator/
  products/page.tsx` catalog query, `app/(public)/p/[creator]/
  [slug]/page.tsx` (both the main product — 404s via `notFound()`
  if hidden — and the "More from this creator" recommendations
  query), `app/(public)/p/[creator]/[slug]/order/page.tsx` (same
  404 rule, since a buyer could hit this checkout page directly),
  and `app/api/public/orders/route.ts` (rejects with the same
  generic "Link not found" 404 as a nonexistent link, in case the
  API is hit directly bypassing the UI). Existing affiliate
  links/applications for a hidden product are left alone — they
  stay on record, only the live storefront page stops resolving.
  (4) Admin UI: `app/admin/products/product-form.tsx` gained a
  required Stock number input (Pricing card) and a "Published"
  checkbox (new Visibility card, with inline copy explaining the
  auto-hide-at-0-stock rule) — checked via `PATCH` on `product.id`.
  `app/admin/products/products-client.tsx` gained a
  Published/Unpublished + stock-count badge pair and a one-click
  Publish/Unpublish button per product card (no need to open the
  full edit form just to toggle visibility), using the same PATCH
  endpoint. Verified live against the real dev DB end-to-end: reset
  a real product to `stock: 1`, hit `PATCH .../fulfillment` with
  `DELIVERED` on a real undelivered order for it — confirmed stock
  dropped 1→0 automatically, the storefront page 404'd, and the
  product vanished from a direct `findMany({ where: { isPublished:
  true, stock: { gt: 0 } } })` query (creator catalog's exact
  query). Then `PATCH`'d stock to 5 — storefront came back to 200
  immediately, no other write needed. Then manually toggled
  `isPublished` false/true independent of stock — 404 then 200,
  confirming the two conditions are genuinely independent. Reverted
  all test mutations (product stock/publish state, the order's
  delivery/fulfillment/cashReconciled fields, and deleted the
  test-induced Commission row) back to their exact original values
  afterward. Also had to restart the dev server mid-session —
  Turbopack had cached the pre-migration Prisma client and was
  throwing `PrismaClientValidationError: Unknown field isPublished`
  until restarted; `prisma generate` alone wasn't enough. `tsc
  --noEmit` clean throughout.

- **2026-07-28 — Admin notifications bell added.** Admin previously
  had no equivalent of the creator's notifications bell
  (`app/creator/notifications-bell.tsx` +
  `lib/creator-notifications.ts`), and `AdminShell` had no
  persistent header at all (only a mobile-only top bar with a menu
  button, no desktop header). Added: (1) `lib/admin-notifications.ts`
  — `getAdminNotifications()` returns an action queue (not a
  decision-history feed like the creator one) of everything
  currently PENDING and awaiting an admin decision: product
  Applications, creator onboarding submissions
  (`creatorProfileStatus: "PENDING"` + onboarding completed), and
  Withdrawal requests — mirrors the "Pending" counts already shown
  on the Applications/Creators/Withdrawals list pages. Each item
  links to where it's actioned (`/admin/applications`,
  `/admin/creators/[id]`, `/admin/withdrawals`). (2)
  `app/admin/notifications-bell.tsx` — adapted from the creator
  bell (same localStorage-only "seen" tracking, key
  `admin-notifications-seen`), with items wrapped in `Link` so
  clicking one navigates straight to the relevant queue. Tile
  colors: teal for applications, blue for creators, peach for
  withdrawals (`orange-100`/`orange-700` don't exist in
  `app/globals.css` — only `--orange-500` — so withdrawals use the
  existing `peach-100`/`peach-700` pending-badge colors instead).
  (3) `app/admin/admin-shell.tsx` restructured to match
  `app/creator/creator-shell.tsx`'s pattern — the header (with the
  bell) is now inside the content column and sticky at all
  breakpoints, not just a mobile-only bar. (4) `app/admin/
  layout.tsx` fetches notifications server-side and passes them to
  `AdminShell`, same as `app/creator/layout.tsx` does. Verified
  live: signed in as the real admin (`natixr7@gmail.com`) via the
  dev OTP bypass, confirmed `GET /admin` returns 200 with the bell
  button in the header, and called `getAdminNotifications()`
  directly against the real dev DB — returned 8 real pending
  Applications sorted newest-first with correct creator/product
  names. `tsc --noEmit` clean.

- **2026-07-28 — Commission trigger collapsed to Delivered-alone;
  creators can no longer see an order until it's Delivered.**
  Supersedes the 2026-07-18 "two-step trigger" decision recorded
  below — that entry is left in place for history but is no longer
  current. (1) `lib/commission/index.ts`'s `maybeCreateCommission`
  no longer requires `cashReconciledAt` to already be set: when an
  order is Delivered and has no commission yet, it now auto-sets
  `cashReconciledAt` (if null) in the same call, then creates the
  Commission. This was a deliberate reversal of the COD fraud brake
  (delivered/cash-collected could diverge) — confirmed explicitly
  with the user before implementing, since it changes financial/
  fraud-prevention behavior. The separate "Mark cash reconciled"
  admin action/route (`.../cash-reconciled/route.ts`) still exists
  for admins who want to record reconciliation independently/
  earlier; it's just no longer a precondition. (2) Creator-facing
  order counts are now filtered to `deliveryStatus: "DELIVERED"`
  only, so an order stays invisible to its creator until admin
  marks it delivered (it could still be cancelled/returned before
  that, so surfacing it earlier would be premature): `app/creator/
  page.tsx`'s `ordersCount` KPI, `app/creator/links/page.tsx`'s
  per-link `_count.orders`, and `app/creator/orders/[id]/invoice/
  page.tsx`'s lookup (added `deliveryStatus: "DELIVERED"` to the
  `findFirst` `where`, as defense in depth — a creator could
  otherwise reach an undelivered order's invoice directly by ID).
  The Earnings page/creator home commission list were already
  implicitly gated (Commission only exists once Delivered), so no
  change needed there beyond the trigger change in (1). Verified
  live against the real dev DB (port 4000, Postgres :5433): called
  `maybeCreateCommission` directly on a real Delivered order that
  had `cashReconciledAt: null` and no commission — confirmed it set
  `cashReconciledAt` and created a `PENDING` commission in one call;
  reverted that test commission/timestamp afterward. Also confirmed
  via raw SQL that total vs. delivered order counts genuinely
  diverge in the seed data (e.g. one creator: 5 total / 3
  delivered), so the new filter is meaningfully different from the
  old behavior. `tsc --noEmit` clean.

- **2026-07-28 — Pending creators skip OTP and land on the
  "application submitted" page; deactivate action added to the
  admin creators list.** (1) `/api/auth/request-otp` now looks up
  the email first: if it belongs to a `CREATOR` with
  `creatorProfileStatus: "PENDING"`, it skips generating/sending a
  code entirely and returns `{ sent: false, pending: true }`
  instead of the usual `{ sent: true }` — no more re-sending them a
  fresh code every time they hit sign-in, since they're headed to
  the pending page regardless. This is a deliberate, narrow
  carve-out from the route's existing "never let a caller
  enumerate registered emails" rule, scoped only to the
  pending-application case (approved creators and unregistered
  emails still get the identical generic response). (2)
  `components/auth/auth-entry.tsx`'s `requestCode()` checks
  `body.data.pending` and `router.push("/onboarding/pending")`
  instead of advancing to the code-entry step. (3)
  `app/onboarding/pending/page.tsx` now tolerates no session — it
  only runs its creator-record redirect checks when a session
  exists; an unauthenticated visitor (routed here straight from the
  email step) just sees the generic `PendingApprovalCard`, which
  shows no personal data. (4) Added a "Deactivate creator"/status
  badge action to the admin creators *list* page
  (`app/admin/creators/creators-client.tsx` +
  `app/admin/creators/page.tsx`), reusing the existing
  `CreatorDeactivateButton` from the detail page — that
  deactivate/reactivate feature (API routes, `isActive` +
  `deactivatedAt`, sign-in block in `auth.ts`) already existed on
  the per-creator detail page; this just surfaces it in the table
  too. Verified live: `POST /api/auth/request-otp` returns
  `{sent:false,pending:true}` for a temporarily-flagged pending
  creator and the normal `{sent:true}` for an approved creator and
  an unregistered email; `GET /onboarding/pending` renders
  "Application submitted" with no session. Test DB rows reverted
  after verification. `tsc --noEmit` clean.

- **2026-07-28 — Public storefront product page UI polish (3 fixes).**
  (1) "More from this creator" is now a horizontally-scrollable
  snap row instead of a wrapping grid — `flex snap-x snap-mandatory
  overflow-x-auto` with fixed-width `w-[180px] sm:w-[220px]
  shrink-0 snap-start` cards, scrollbar hidden via a new
  `.scrollbar-hide` utility in `app/globals.css`. Recommendation
  query `take` bumped 4 → 10 so there's more to slide through.
  (2) Product page background changed from `bg-surface-100` (grey)
  to `bg-surface-0` (white). (3) Removed the grey mat/edge behind
  the main product image in `product-gallery.tsx` — dropped the
  inner `rounded-[20px] bg-surface-100` wrapper and the outer
  card's `p-4`, so the image now fills a single `overflow-hidden
  rounded-[24px] bg-surface-0 shadow-card` card edge-to-edge.
  Thumbnail backgrounds left intact (they need a visible hit-area).
  Files: `app/(public)/p/[creator]/[slug]/page.tsx`,
  `app/(public)/p/[creator]/[slug]/product-gallery.tsx`,
  `app/globals.css`. Verified in-browser on the running dev server
  (port 4000): confirmed white background, no mat around the main
  image, and the recommendations row overflows horizontally when
  seeded with >4 items (temporary test links added and then
  removed). `.scrollbar-hide` confirmed compiled into served CSS.

- **2026-07-23 — Currency label switched from "Birr" to "ETB" project-wide
  (display only).** Replaced every user-facing `Birr` string with `ETB`
  across app/components/lib (` Birr` → ` ETB`, `(Birr)` → `(ETB)`, plus the
  two edge cases `"Birr…` and `>Birr<`). Deliberately kept the DB/code
  identifiers unchanged (`priceBirr`, `commissionBirr`, `amountBirr`,
  `compareAtBirr`, the `birr()` formatter name, Prisma columns) — those are
  code, not display, and renaming columns would be a large breaking
  migration. `tsc` clean; only pre-existing unused-import warnings remain.

- **2026-07-23 — Rebranded to Binoregn (logo, favicon, footer).** New
  `components/logo.tsx` (`BrandMark` = teal rounded "B" square recreating
  the app icon; `Wordmark`). Swapped the old "A"/ShoppingBag marks +
  "Affiliate Market(place)" text for the BrandMark + "Binoregn." wordmark
  across both sidebars, both mobile shells, both invoice pages, and the
  landing nav. Added `app/icon.svg` (teal "B" square) as the favicon and
  updated `app/layout.tsx` metadata title/description. Rebuilt the landing
  footer as a dark section with brand + link columns (Product/Account/
  Company), a CTA, copyright, and a giant low-opacity "Binoregn" wordmark
  watermark. Also rebranded user-facing email subjects (`lib/mailer.ts`)
  and `SMTP_FROM`. `tsc` + `eslint` clean. Note: BrandMark is a
  teal-square/white-"B" recreation (the raster logo image wasn't a repo
  asset); drop in the real SVG/PNG later if preferred.

- **2026-07-23 — Landing page (`app/page.tsx`) fully rebuilt in an
  Aeline-style layout, content adapted from Awin's creator/influencer
  affiliate messaging.** New sections: gradient hero (headline + CTA pill
  + honest trust line + an earnings preview panel, no stock photo), an
  overlapping bento row, a positioning statement with inline icon accents,
  a 4-card stat row (light/lime/dark tones), a feature strip (replaces the
  fake logo row), How-it-works (the real 4 steps), a For-creators value
  section, a gradient final-CTA, and footer. Palette matches the
  reference (blue hero, lime `#c9f24a` accent, dark `#0f1115` cards).
  Held to the project's no-fabricated-credibility rule: **no fake
  ratings/user counts/brand logos** — every stat is a real product fact
  (0 Birr fees, 100% transparent, fixed commission, one dashboard). CTAs
  point to /sign-up and /sign-in. `tsc` + `eslint` clean.

- **2026-07-23 — Cloudinary fully removed; images stored locally.**
  Product image upload no longer uses any third-party service. Deleted
  `lib/cloudinary.ts` and `POST /api/admin/uploads/signature`, uninstalled
  the `cloudinary` npm package, and dropped `CLOUDINARY_*` from `.env` /
  `.env.example`. Uploads now go to `POST /api/admin/uploads`
  (`runtime="nodejs"`), which validates type/size and writes bytes to
  `public/uploads/` (gitignored, served at `/uploads/<name>`); the admin
  form posts the file there directly and can also paste an external image
  URL. Updated `architecture.md` (File Storage Implementation + storage
  tables), `project-overview.md`, and the `lib/validations/product.ts`
  comment to match. `tsc` + `eslint` clean. Deploy note: mount
  `public/uploads/` as a volume in containers so images persist.

- **2026-07-22 — Re-restored `buyerCity` on order read pages.** Added
  `buyerCity` back into the select/render blocks on
  `app/(public)/order/[id]/page.tsx`,
  `app/admin/orders/[id]/invoice/page.tsx`, and
  `app/creator/orders/[id]/invoice/page.tsx` after it had been removed
  in a previous build-unblock pass.

- **2026-07-22 — Checkout city + notes fields; Add-to-Cart keys off
  size/color.** Added `Order.buyerCity` (required in app, nullable in DB
  for old rows) and `Order.buyerNotes` (optional) via `prisma db push`.
  New `lib/ethiopian-cities.ts` (major cities + "Other"). Checkout
  (`checkout-form.tsx`) gained a required **City** `<select>` and an
  optional **Notes** `<textarea>`; validation (`lib/validations/order.ts`)
  requires city, keeps email+notes optional; the public orders API stores
  both. City/notes now surface in admin orders list, both invoices, and
  the public tracking page. Separately, `showAddToCart` on the storefront
  now = `product has sizes || colors` (was: recommendations exist).
  Verified live: city dropdown + notes render, Add-to-Cart shows for a
  sized/colored product. NOTE: order **submission** needs the user's dev
  server restarted to load the regenerated Prisma client (new columns).
  `tsc` clean; eslint clean except 2 pre-existing unused-import warnings
  in orders-client.tsx.

- **2026-07-22 — Add-to-Cart hidden when there are no recommendations.**
  `product-purchase-panel.tsx` takes a `showAddToCart` prop; `page.tsx`
  passes `recommendedLinks.length > 0`. When the creator has no other
  products (no "More from this creator" section), Add-to-Cart is hidden
  and Buy Now goes full-width; when recommendations exist, both buttons
  show. Verified live (single-product creator → Buy Now only). `tsc` +
  `eslint` clean.

- **2026-07-22 — Storefront: seller card removed, creator-only
  recommendations, functional Add-to-Cart.**
  `app/(public)/p/[creator]/[slug]`: removed the seller/Follow card (and
  its fabricated rating/sold/sellerName vars + unused Heart/Star imports).
  Recommendations kept but retitled "More from this creator" — query is
  already scoped to the same `creatorId` (never other creators, never the
  creator's identity) and the section is hidden entirely when the creator
  has no other links; cleaned the cards of the fake Heart/wishlist, fake
  rating, and fabricated compare-at fallback, and gave each a real teal
  "View product" CTA. Made "Add to Cart" functional: it's now a Link to
  the COD checkout (`/order?qty=N`) with the selected quantity, same
  destination as Buy Now (no multi-item cart exists in this MVP; flag if a
  real cart is wanted). Verified live — seller card gone, recs hidden for
  a single-product creator, both CTAs link to checkout. `tsc` + `eslint`
  clean.

- **2026-07-22 — Delivery Options values are now admin-editable defaults
  set at product creation.** `app/admin/products/product-form.tsx`: added
  a `DELIVERY_DEFAULTS` const and pre-fills the Discount (`shippingDiscountLabel`
  = "Disc 15%"), Delivery Time (`shippingDeliveryTime` = "3-4 Working
  Days"), and Return (`returns` = "7 Days easy return") fields **only on
  create** (`product ? existing : default`), so editing an existing
  product still shows its real stored values. These persist through the
  already-wired API and feed the storefront Delivery Options card; the
  storefront's own hardcoded fallbacks stay as a safety net for
  pre-existing products with blank fields. `tsc` + `eslint` clean.

- **2026-07-22 — Delivery Options card now always shows all four rows.**
  `app/(public)/p/[creator]/[slug]/page.tsx`: rebuilt `deliveryItems` so
  the card always renders Discount / Payment / Delivery Time / Return &
  Warranty (2×2). Values prefer real data → admin `shipping` array →
  platform-policy default (COD platform, so payment/delivery/returns are
  uniform site-wide): Payment always "Cash on Delivery",
  Delivery Time `shippingDeliveryTime ?? shipping[2] ?? "3–4 Working
  Days"`, Return `returns[0] ?? "7 Days easy return"`. Discount shows a
  real % only from a genuine `compareAtBirr`, else the admin discount
  label / `shipping[0]`, else "No discount" (no fabricated percentage).
  Icon tiles restyled to the reference's filled gray circles
  (`bg-surface-100`, `text-foreground`). Verified live — all four rows
  render; no console errors. `tsc` + `eslint` clean.

- **2026-07-22 — Storefront right column: Main Notes → Size; teal CTA +
  overflow fix.** `app/(public)/p/[creator]/[slug]`: removed the Main
  Notes pill section and replaced it with a conditional **Size** pill
  section (renders only when `product.sizes` is non-empty). Removed the
  now-duplicate size selector (+ `sizes` prop) from
  `product-purchase-panel.tsx`. Delivery Options card left unchanged.
  Earlier same-day fix retained: Buy Now / swatch ring / active thumbnail
  recolored to teal (design-system) and the Add-to-Cart/Buy-Now row moved
  to a 2-col grid to stop the Buy Now button overflowing on large screens.
  Verified live, no console errors. `tsc` + `eslint` clean.

- **2026-07-22 — Added DB clear command.** Created
  `prisma/clear.ts` and wired `npm run clear` in `package.json` to
  wipe application tables (FK-safe delete order) when a full reset is
  needed.

- **2026-07-22 — Seed script reduced to admin-only.** Per request,
  `prisma/seed.ts` now seeds only the single `ADMIN_SEED_EMAIL`
  account and no longer creates payout options, products, creators,
  applications, links, orders, or commissions.

- **2026-07-22 — Auth host trust fix for IP/domain access.** Enabled
  `trustHost: true` in `auth.ts` so Auth.js accepts requests served by
  public IP/domain hosts (for example `149.102.140.160`) instead of
  throwing untrusted-host errors. Added `AUTH_URL` and
  `AUTH_TRUST_HOST` guidance to `.env.example`.

- **2026-07-22 — Storefront product page matched to a fragrance-style
  reference.** `app/(public)/p/[creator]/[slug]`: added a **Main Notes**
  pill section (rendered from the product's real `features` array),
  wrapped the gallery thumbnails in a white rounded card (3-up grid), and
  simplified the info cards to just **Delivery Options** — removed the
  separate Shipping card and the Features/Care accordions the reference
  doesn't show (Features now surfaces as the Main Notes pills). Color/size
  selectors still render when a product actually has them (the reference
  perfume had none; the test bag does). Verified live, no console errors.
  `tsc` + `eslint` clean.

- **2026-07-22 — Creator Links / Applications / Settings aligned to the
  home dashboard style.** New shared `components/creator-stat-card.tsx`
  (tinted KPI card matching the home KPI row). `app/creator/links` and
  `app/creator/applications` rebuilt as a tinted KPI row + a clean carded
  table (home "Your top links" style): Links shows Active links / Total
  views / Total orders + a Product/Views/Orders/Copy-link table;
  Applications shows Total / Approved / Pending + a
  Product/Commission/Applied/Status table (pending-first sort + search +
  pagination kept). Settings gained a profile summary card at top
  (avatar + display name + @username · platform · category) and its form
  section cards bumped to `rounded-[16px]` for consistency. Verified live
  as a creator (no console errors). `tsc` + `eslint` clean.

- **2026-07-22 — Public storefront product page restyled from a
  product-detail UI reference.** `app/(public)/p/[creator]/[slug]`: new
  `product-gallery.tsx` (interactive main image + thumbnail selector),
  `collapsible-card.tsx` (chevron accordion card). Right column is now
  minimal title + price (dropped fabricated rating/sold/category from the
  top), a collapsible **Description** card, square color swatches + dark
  quantity steppers (`product-purchase-panel.tsx`), and two icon-grid
  accordion cards: **Shipping** (Discount/Package/Delivery/Arrives from
  the real shipping fields) and a new **Delivery Options** (real:
  Cash-on-Delivery payment [platform is COD], Return & Warranty from
  `returns`, discount from a genuine `compareAtBirr` only, delivery time).
  Features/Care kept as collapsed accordion cards; removed the old
  `description-toggle.tsx`. Verified live at the given URL — gallery
  switch, swatches, steppers, and Buy Now→order all work, no console
  errors. NOTE: "Add to Cart" kept for the reference look but has no
  backend (no cart in scope) — flag if it should be removed or a real
  cart built. `tsc` + `eslint` clean.

- **2026-07-22 — Creator Earnings page restyled to a fintech dashboard.**
  Rebuilt `app/creator/earnings/page.tsx` from a banking-UI reference,
  all mapped to real data (no new backend): left column has a dark
  gradient "Available to withdraw" card (balance + masked payout account
  + method), the existing `WithdrawalForm` kept intact under a "Withdraw"
  block, and an "Earnings by product" bar breakdown; main column has
  Total earned / Pending / Paid summary tiles and a new
  `earnings-history.tsx` client component — a searchable, filterable
  combined feed of commissions (in, +) and withdrawals (out, − when
  approved / neutral when pending/rejected), with the per-order Invoice
  link preserved. Verified live signed in as a creator (no console
  errors). `tsc` + `eslint` clean.

- **2026-07-22 — Creator product preview is a bottom sheet on mobile.**
  `catalog-client.tsx`: the product preview panel now anchors to the
  bottom below `sm` (rounded top, drag-handle pill, `max-h-88vh`, slides
  up via a `sheet-up` keyframe added to `globals.css`) and keeps the
  right-side drawer at `sm+` via `sm:` overrides. Verified live at both
  widths (mobile bottom sheet + desktop right drawer) signed in as a
  seeded creator. `tsc` + `eslint` clean.

- **2026-07-22 — Creator Products page rebuilt as a filtered shop
  (left-sidebar + grid).** `app/creator/products/catalog-client.tsx`
  redesigned from a UI reference. New left filter sidebar, all backed by
  real product data: collapsible **Categories** (multi-check), **Product
  Price** (real Birr buckets with live counts + "All prices", plus a
  custom dual-thumb range slider and min/max number inputs), and **Size &
  Fit** (from `Product.sizes`). Live client-side filtering + "Clear all
  filters"; mobile "Filter" toggle with an active-count badge. Grid
  restyled to carded cells (image, name, 2-line description, price + real
  Apply/status/commission action); preview drawer kept and given an Apply
  CTA. Deliberately omitted the reference's **Gender** filter (no such
  field on Product — would be speculative schema scope) and the "Create
  Order" / heart-wishlist controls (not creator features); kept teal, not
  the reference's orange. Dropped the old KpiStrip/PageHeader on this page
  and trimmed the two now-unused count queries from `page.tsx`. `tsc` +
  `eslint` clean.

- **2026-07-22 — Creator home restyled to a NevBank-style fintech
  dashboard; delivered data hidden from creators.** `app/creator/page.tsx`
  redesigned from a UI reference, mapping every element to real data (no
  invented features): a hero "Creator earnings" card (available balance +
  all-time earned, Request-withdrawal / Payout-details actions), a teal
  promo card ("Grow your earnings" → browse products), a 4-KPI row
  (pending / paid / active links / link views), a "Latest activity" feed
  (commissions in as +, approved withdrawals out as −), and an "Earnings
  breakdown" panel: 7-day / 30-day / all-time buckets plus an inline SVG
  donut of earnings-by-product with a legend (brand-hex palette from
  globals.css). `Date.now()` kept in a module-level helper so the server
  component render stays pure (react-hooks/purity). Separately, all
  Delivered data/columns/wording removed from creator surfaces (home,
  links page, earnings copy, invoice status → StatusBadge "Completed")
  while the delivered mechanic stays fully intact for admin. `tsc` +
  `eslint` clean.

- **2026-07-22 — Creator home dashboard reworked + notifications; admin
  applicant detail view.** Two units:
  1. **Admin applicant/creator detail page** at `/admin/creators/[id]`
     (`page.tsx` + `creator-approve-button.tsx`). One reusable view
     showing the creator's onboarding profile, payout details,
     earnings (total/pending/paid/available balance — same math as the
     creator earnings page), revenue driven (order value from their
     links), orders/delivered/active-links/applications counts, and
     tables for applications, affiliate links (views/orders/delivered),
     commissions, and withdrawals. Linked from both the Applications
     list (applicant name + a "View" action; added `creator.id` to that
     page's query) and the Creators list ("View" action).
  2. **Creator home page** (`app/creator/page.tsx`): removed the
     email/identity card from the right panel; added a notifications
     bell to a new content-area top header (`creator-shell.tsx` now
     renders a persistent header with `notifications-bell.tsx`, fed by
     `lib/creator-notifications.ts` — real events only: application
     decisions, commission earned/paid, withdrawal decisions). Dashboard
     enriched with real creator data: KPI row now Pending/Paid earnings,
     Active links, Link views; added "Your top links" (views/orders/
     delivered) and "Recent orders" tables; Activity gained an "Orders
     delivered" bar. Retired the leftover violet→pink gradient for the
     teal system. `tsc` + `eslint` clean (full `next build` not run —
     user was mid-review).

- **2026-07-20 — Storefront content fully admin-editable.** Added new
  product fields for seller card + shipping highlight content
  (`sellerName`, `sellerVerified`, `sellerRating`, `sellerSoldCount`,
  `shippingDiscountLabel`, `shippingPackageLabel`,
  `shippingDeliveryTime`, `shippingArrives`) plus admin form inputs
  and seed defaults so the storefront matches the desktop reference.

- **2026-07-20 — Storefront matches mobile product UI.** Rebuilt
  `/p/[creator]/[slug]` to match the provided mobile layout: rounded
  hero image, thumbnail strip, pill selectors, quantity stepper,
  dual CTAs, shipping card, and a recommendations grid. Recommendations
  are real affiliate links for the same creator (no identity exposed).
  The checkout form now reads an optional `qty` query param to sync
  with the Buy Now button.

- **2026-07-20 — Storefront desktop layout + product schema fields.**
  Updated `/p/[creator]/[slug]` to match the desktop reference: two-column
  hero layout, compare-at price, rating/sold stats, seller card, and
  a 4-up recommendations grid. Added optional product fields to the
  schema for `compareAtBirr`, `rating`, `ratingCount`, and `soldCount`,
  plus admin form inputs and seed defaults.

- **2026-07-20 — Storefront description read-more.** Product
  descriptions now show a truncated preview with a "Read more"
  toggle that expands inline on tap.

- **2026-07-20 — Seed products now have images.** All 8 demo products
  had `imageUrls: []` — no seed step ever set them. Added a
  `PRODUCT_IMAGE_SLUGS` name→slug map and an `imageSeed()` helper
  (deterministic `https://picsum.photos/seed/<slug>-<n>/800/600`
  URLs — no Cloudinary upload happens from a script, only via the
  admin product form's signed client upload, so a stable public
  placeholder host is the honest option here; each URL was curl-
  verified live, 200 + `image/jpeg`, before being hardcoded).
  `seedDemoData()`'s create calls now set 2 images per product.

  Since `seedDemoData()` is marker-guarded (skips entirely once
  `DEMO_MARKER` exists — same pattern as the earlier DRAFT/stock seed
  bug from 2026-07-19) and the 8 products already existed with empty
  `imageUrls`, the new create-time images alone would never have
  reached the real rows. Added `backfillProductImages()` — runs
  unconditionally in `main()`, `updateMany` scoped to `imageUrls: {
  isEmpty: true }` per product name, so it only touches rows still
  missing images and is a no-op on repeat runs (confirmed: first run
  logged "Backfilled images for 8 product(s)", second run logged
  nothing).

  Verified live: direct DB check shows all 8 products with 2 image
  URLs each; curled the storefront page for a real affiliate link —
  both images render, including the multi-image thumbnail row; curled
  `/admin/products` as the seeded admin — all 8 product cards show
  their image. `npx tsc --noEmit`, `eslint`, and `npm run build` all
  clean.

- **2026-07-20 — Creator invoice access.** Added a creator invoice
  page at `/creator/orders/[id]/invoice`, scoped to the signed-in
  creator's orders, and linked it from the Earnings commission list.
  Updated `context/project-overview.md` to include creator invoice
  access and broadened the invoice component spec to cover both admin
  and creator surfaces.

- **2026-07-20 — Admin invoice view + Tailwind CSS-inspired design
  system update.** Added an admin-only order invoice page at
  `/admin/orders/[id]/invoice` with a printable, carded layout
  (header metadata, billed-to details, line-item table, totals).
  Orders list now links directly to the invoice from each tracking
  card. Updated `context/design-system.md` to document the invoice
  layout (Tailwind CSS-inspired spacing and neutral tables) and
  `context/ui-context.md` to cite tailwindcss.com as supplemental
  inspiration. Updated `context/project-overview.md` scope to include
  non-tax, printable order invoices for admins.

- **2026-07-20 — Withdrawal automation confirmed OFF; audited the full
  request→approval flow.** User asked to confirm withdrawals aren't
  automatic and to audit the whole process. Asked a clarifying
  question first since payout automation is explicitly in
  `ai-workflow-rules.md`'s "never guess" list — user picked "Manual
  only": creator requests, admin manually approves/rejects, admin
  pays offline. No settings toggle for automation was built (would
  have been speculative, unused scope). This matches what's already
  built (`Withdrawal.status`: `PENDING` → `APPROVED`/`REJECTED`, no
  automatic transition anywhere).

  Audited every step end to end and found one real gap: the admin
  Withdrawals table (`app/admin/withdrawals/withdrawals-client.tsx`)
  fetched `payoutAccountName`/`payoutAccountNumber`/`payoutBankName`
  for every row but never rendered any of them — just the bare
  `payoutMethod` enum value. Admin had no way to actually see *where*
  to send the money before approving. Fixed by adding a `PayoutDetails`
  cell (replacing the old bare "Method" column), reusing the exact
  label map and layout already established by `PayoutInfo` on the
  Commissions page for consistency.

  Verified live end to end with a disposable test creator (paid
  500 Birr commission, cleaned up afterward): requested a withdrawal
  for the full balance (201), a second request for more than the
  (now zero) remaining balance correctly 400s; admin's rendered
  `/admin/withdrawals` page shows the real account name/number/method;
  approved it, confirmed re-deciding the same withdrawal 409s and a
  creator hitting the admin approve route 403s; confirmed the
  creator's Earnings page correctly shows `0 Birr` left after
  withdrawals and the withdrawal row as "Approved". `npx tsc --noEmit`
  and `npm run build` both clean.

  Noted, not changed: `Withdrawal` only has one manual decision step
  (`APPROVED`/`REJECTED`), unlike `Commission`'s two-step
  `PENDING`→`PAID` — i.e. "Approve" and "money actually sent" are the
  same moment here, with no separate "mark paid" action. This matches
  `architecture.md`'s documented design, but is worth knowing if a
  future request asks for a distinct paid-confirmation step.

- **2026-07-20 — Fixed broken "Order now" link + added per-link view/
  order/delivered stats.** User reported clicking a storefront link's
  "Order now" button landed on `/p/undefined/<slug>/order` instead of
  `/p/<creator>/<slug>/order`. Root cause:
  `app/(public)/p/[creator]/[slug]/page.tsx` destructured `const {
  slug } = await params` (dropping `creator`) but then read
  `params.creator` directly off the still-unresolved `Promise` a few
  lines later — `Promise.creator` is `undefined`, which the template
  literal happily stringified. Fixed by destructuring `{ creator, slug
  }` and using `creator` at the link-href site.

  Order→creator attribution itself was already correct end-to-end (no
  bug there) — `POST /api/public/orders` resolves `creatorId`
  server-side from the affiliate link and `app/admin/orders` already
  selects and renders `creator.email`; verified live again as part of
  this unit (admin session, real order, creator email visible in the
  table).

  Added the actually-new part of the request — per-link performance
  visible to the creator: `AffiliateLink.viewCount Int @default(0)`
  (new field + additive migration
  `20260720140101_add_affiliate_link_view_count`), incremented once
  per storefront page load in
  `app/(public)/p/[creator]/[slug]/page.tsx` (awaited, errors
  swallowed — a view-count miss must never break the actual page).
  `app/creator/links/page.tsx` now also fetches each link's order
  count (`_count.orders`) and a separately-`groupBy`'d delivered-only
  count (Order stores `deliveryStatus`, not AffiliateLink, so this
  can't be a nested relation count), and `links-list-client.tsx`
  renders all three (views / orders / delivered) per row.

  Verified live: visited the storefront page for a real seeded link,
  confirmed `viewCount` went 0→1 via a direct DB check, then confirmed
  the creator's `/creator/links` page renders `0` for an unvisited
  link and `1` for the visited one (had to restart the dev server
  mid-way — same recurring "stale Prisma client after a schema
  migration" issue as before, restart resolved it). `npx tsc --noEmit`
  and `npm run build` both clean (46 routes).

- **2026-07-20 — Pagination + search on creator Links and
  Applications pages.** `app/creator/applications` already had a
  search box (via `SearchInput`) but no pagination; `app/creator/links`
  had neither. Added the same `SearchInput` + `Pagination` combo
  already established on 5 admin pages (`components/pagination.tsx`,
  client-side slice at `PAGE_SIZE = 8`, page resets to 1 on query
  change): extended `applications-list-client.tsx` in place, and
  extracted `app/creator/links/page.tsx`'s previously all-inline JSX
  into a new `links-list-client.tsx` so it could hold search/page
  state (the server page now just fetches via Prisma and renders that
  client component, per the server-reads/client-interacts split in
  `code-standards.md`). Verified live: signed in as a seeded demo
  creator (`bruk.tesfaye@example.com` — had to mark them
  onboarded/`APPROVED` first, since seed.ts inserts their applications/
  links directly and never runs them through the onboarding gate) and
  curled both pages — real product names, statuses, and both search
  placeholders render. `npx tsc --noEmit`, `eslint`, and `npm run
  build` all clean. Note: clicking through pages is client `useState`,
  which curl can't exercise — reused the exact slicing pattern from
  `app/admin/applications/applications-client.tsx` (already
  browser-verified elsewhere) rather than writing new pagination math.

- **2026-07-20 — Admin-managed payout options (banks + wallets).**
  Note: this file's "Current Phase"/"Completed" sections below are
  stale relative to the actual codebase (a large external restructure
  — Withdrawal model, creator onboarding wizard, admin-shell UI,
  Product/User schema changes — happened outside sessions recorded
  here). This entry only documents the newest unit; the rest of the
  file needs a fuller reconciliation pass at some point.

  Request: admin needed to manage the bank list and wallet (Telebirr)
  option shown on the creator sign-up/settings payout step, instead of
  the hardcoded `CREATOR_BANKS` array in `lib/creator-options.ts`.
  Treated as reference-data/CMS work, not a payout-automation change
  (money still moves manually, admin-mediated — `PayoutMethod`'s
  BANK_TRANSFER/TELEBIRR split is untouched) — so proceeded without
  escalating per the ai-workflow-rules.md payout-ambiguity rule.

  Built:
  - `PayoutOption` model + `PayoutOptionCategory` enum (`BANK`/`WALLET`)
    in `prisma/schema.prisma` — admin-manageable `{ category, name,
    isActive, sortOrder }`, `@@unique([category, name])`.
  - `app/api/admin/payout-options` (GET list all, POST create) and
    `app/api/admin/payout-options/[id]` (PATCH isActive toggle) —
    admin-only. `app/api/creator/payout-options` (GET, active-only) —
    creator-only, consumed by the sign-up/settings forms.
  - `app/admin/settings/page.tsx` + `payout-options-client.tsx` — new
    admin Settings page, two sections (Bank accounts / Wallets), each
    with an active/inactive toggle button and an add-new-option form.
    Wired the sidebar's previously-dead `<span>Settings</span>`
    placeholder to a real `Link` to `/admin/settings`.
  - `components/creator-onboarding-form.tsx` and
    `creator-settings-form.tsx` now fetch `/api/creator/payout-options`
    on mount instead of importing the static `CREATOR_BANKS` array;
    the wallet toggle's label is now the first active WALLET option's
    name (falls back to "Telebirr" if the fetch is empty/fails).
    Deleted the now-unused `CREATOR_BANKS` export.
  - `prisma/seed.ts` gained `seedPayoutOptions()` (idempotent upsert on
    `[category, name]`) seeding the original 8 banks + Telebirr so
    existing behavior doesn't regress.

  Migration note: `prisma migrate dev` couldn't be used directly — the
  live DB's `_prisma_migrations` table already had 2 applied
  migrations (`20260719110253_dev`, `20260719115939_add_product_details`)
  whose folders were missing from `prisma/migrations/` on disk (from
  the external restructure), and Prisma wanted to reset the whole
  schema to reconcile. Instead used `prisma migrate diff` (read-only,
  DB vs schema.prisma) to confirm the only real drift was additive —
  the new `PayoutOption` table/enum plus an unrelated
  `Order.fulfillmentStatus` column that admin-orders code already
  referenced but the DB didn't have yet (that page was likely
  erroring) — then hand-applied that exact SQL via `prisma db execute`
  and recorded it with `prisma migrate resolve --applied`, without
  touching the two phantom history rows.

  Also fixed, found via `tsc`/`build` while verifying this unit (all
  pre-existing, unrelated to the payout-options work itself):
  - `app/sign-up/page.tsx` and `app/onboarding/page.tsx` read
    `user.creatorProfileStatus` but never selected it from Prisma —
    always `undefined`, so the "already approved, skip onboarding"
    redirect branch could never fire correctly. Added the field to
    both `select`s.
  - `app/creator/earnings/withdrawal-form.tsx` — prop type didn't
    accept the full `PayoutMethod` enum (missing `CBE_BIRR`, which is
    unreachable dead code — no UI ever sets it — but still a real type
    error blocking `npm run build`). Widened the prop type; internal
    state still only offers the two real choices.
  - `components/pending-approval-card.tsx` — used `<Button asChild>`,
    but this project's `Button` (`@base-ui/react/button`) doesn't
    support `asChild` (that's a different library's convention).
    Switched to the `buttonVariants()` + `Link` pattern already used
    in `app/page.tsx`.

  Verified live, not just build/typecheck: signed in as the seeded
  admin via the OTP `000000` dev bypass; created a bank option via
  `POST /api/admin/payout-options` (201), confirmed a duplicate
  create correctly 409s; toggled it inactive via `PATCH` and confirmed
  a separately-signed-in creator's `GET /api/creator/payout-options`
  no longer includes it, then reactivated it and confirmed it
  reappears; confirmed creator hitting the admin route 403s and an
  unauthenticated request 401s; curled `/admin/settings` and grepped
  the rendered HTML for both section headers and the real seeded
  option names. `npx tsc --noEmit` and `npm run build` both clean
  (44 routes, including the 3 new ones).

  Left alone, noted but not touched: `app/creator/earnings/
  payout-method-form.tsx` is dead code (defines `PayoutMethodForm`,
  never imported anywhere) — a leftover from an earlier iteration of
  the earnings page; `CBE_BIRR` remains a fully unreachable enum value
  (never surfaced in any UI, unaffected by this change).

- Public storefront built (`/p/[creator]/[slug]`). All three surfaces
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

**New URL decision**: affiliate links are `/p/[creator]/[slug]` — chosen now
because the Links page needs *something* concrete to construct and
copy, even though the actual public storefront page doesn't exist
yet. **The public storefront page must be built at exactly this
path** (`app/(public)/p/[creator]/[slug]/page.tsx` or similar), or every link
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

## Completed (2026-07-20 — Admin products mobile-first)

- `app/admin/products/products-client.tsx` now renders a mobile-first
  card list for small screens, with the full table retained for
  `md+`. The mobile layout preserves the same real data (price,
  commission, applications, active link status) and keeps the edit
  actions accessible without horizontal scrolling.

## Completed (2026-07-20 — Responsive sidebars)

- Admin and creator shells now show a mobile top bar with a hamburger
  toggle and an off-canvas sidebar drawer, while keeping the
  full-height sidebar visible on `lg+`. Both sidebars close
  automatically on navigation.

## Completed (2026-07-20 — Auth UI refresh)

- `app/sign-in/page.tsx` restyled to match the new mobile-first auth
  reference: Google-first CTA, divider, email entry, and a dedicated
  OTP verification view with six digit boxes and resend support.
 - `/sign-up` now redirects into the creator onboarding flow, since
  onboarding collects the full creator profile after sign-in.

## Completed (2026-07-20 — Creator onboarding flow)

- Added creator onboarding schema fields (username, phone, platform,
  category, payout details) and a new `POST /api/creator/onboarding`
  route to store them.
- Built the four-step onboarding UI at `/onboarding` with a review
  step and a success confirmation screen; creators are redirected
  there until the profile is completed.
- Added admin approval gating: creators see a pending screen until
  approved, and admin can approve from the new `/admin/creators`
  list.

## Completed (2026-07-20 — Creator settings)

- Added `/creator/settings` with a profile + payout form and a
  `PATCH /api/creator/profile` endpoint to update creator details.

## Completed (2026-07-20 — Withdrawals)

- Added creator withdrawal requests with admin approval, plus
  creator earnings UI for totals, remaining balance, and request
  history.
- Added `/admin/withdrawals` to approve or reject withdrawal
  requests.

## Completed (2026-07-20 — Product detail fields + preview)

- Expanded product schema with colors, features, care, shipping, and
  returns fields; admin form updated to edit them.
- Public storefront now renders the richer product sections, and the
  admin products list includes a right-side preview drawer.

## Completed (2026-07-20 — Product sizes)

- Added optional sizes per product; product form, public view, and
  admin preview now hide size UI when unset.

## Completed (2026-07-20 — Product categories)

- Added category + sub-category fields to products, with an optional
  category filter on the creator catalog.

## Completed (2026-07-20 — Applications + orders UI refresh)

- Creator applications list now uses a card layout with product
  imagery and status.
- Admin orders page now uses a tracking-card layout with explicit
  fulfillment steps updated by admin.

## Completed (2026-07-20 — Public order tracking)

- Added quantity + optional email on checkout, order summary before
  submission, and a public tracking page with a shareable link when
  no email is provided.

## Completed (2026-07-20 — Creator catalog preview)

- Added the same right-side product preview drawer to the creator
  products list.

## Completed (2026-07-20 — Demo product details)

- Seed data now includes colors, sizes, and detail sections for the
  demo products to populate the storefront preview.

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

- Built `app/(public)/p/[creator]/[slug]/page.tsx` — the buyer-facing product
  landing + checkout page, at the exact URL the creator dashboard
  already commits to and copies into real links (see the Creator
  Dashboard Implementation note above). Route group `(public)` used
  deliberately here (unlike `app/admin`/`app/creator`, which are
  real folders) — this is the one case where hiding the URL segment
  is exactly what's wanted, since the shareable link has to be
  `/p/[creator]/[slug]`, not `/public/p/[creator]/[slug]`.
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
  (`/p/[creator]/[slug]`, 200, correct product name). This is the first time
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

## Completed (2026-07-20 — Remove password auth)

- Removed password-based sign-in/sign-up in favor of OTP + Google
  only, per latest request. `/sign-up` now routes into onboarding
  after OTP sign-in, and the password provider + `passwordHash`
  field are no longer part of the product.

## Completed (2026-07-20 — Sign-up page entry)

- `/sign-up` now renders the same OTP/Google entry flow as `/sign-in`
  (with sign-up copy) instead of redirecting back to login.
- After a successful sign-in, `/sign-up` immediately shows the
  onboarding steps so the full process is visible in one place.

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

## Completed (2026-07-29 — Admin GMV & Commission Paid card)

- Added `getGmvAndCommissionSummary()` to `lib/dashboard.ts`:
  fetches delivered orders (for GMV = product.priceBirr *
  quantity) and paid commissions, then buckets both into
  weekly/monthly/yearly/lifetime totals using trailing windows
  (last 7/30/365 days, matching the existing "last 365 days"
  KPI captions rather than calendar-boundary buckets).
- New client component `app/admin/gmv-commission-card.tsx`
  renders GMV vs. Total Commission Paid side by side with a
  period toggle; wired into `app/admin/page.tsx` right below the
  KPI strip.
- GMV is intentionally scoped to `DELIVERED` orders only (not
  all orders) — this is the same point a `Commission` row is
  created (see `CommissionStatus` comment in schema.prisma), so
  GMV and commission-paid describe the same completed-sales
  population rather than GMV including still-open orders.
- Not visually verified in-browser: admin auth is OTP-only with
  no dev bypass, so this session couldn't sign in to screenshot
  it. Verified via `tsc --noEmit` (clean) and by mirroring the
  existing query/formatting patterns already used on this page.

## Completed (2026-07-29 — Onboarding form Back/Continue layout)

- `components/creator-onboarding-form.tsx`: moved the "← Back"
  link out of the top of steps 2-4 (previously its own
  standalone text button below the progress bar) into the same
  row as the step's Continue/Submit button, as an `outline`
  variant `Button` (`flex-1`) next to the primary action
  (`flex-[2]`). Step 1 has no Back (nothing to go back to).

## Completed (2026-07-29 — KpiStrip icon badges)

- `components/kpi-strip.tsx`: `KpiItem` now requires an `icon:
  LucideIcon`; the small colored underline dash below each KPI
  value was replaced with an icon badge (`accent` still picks
  the badge's background/text color pair, reusing the same
  pastel tokens as `StatusBadge` — e.g. `orange` now renders as
  peach since there's no dedicated orange-100/700 token).
- Every KpiStrip caller was updated with a matching icon (Clock
  for pending/new, CheckCircle2/BadgeCheck for
  approved/paid/completed, XCircle for rejected/cancelled, plus
  a semantic icon per label elsewhere — Package, Link2, Percent,
  ShoppingBag, PiggyBank, TrendingUp, FileText, Hash,
  CalendarCheck): admin home, Commissions, Withdrawals, Products,
  Applications, Creators list, Orders, and both KpiStrips on the
  Creator detail page.
- `app/admin/gmv-commission-card.tsx` got the same treatment
  (TrendingUp for GMV, BadgeCheck for Total Commission Paid)
  instead of its own colored dash.

## Completed (2026-07-29 — New-order admin notifications)

- `lib/mailer.ts`: added `sendNewOrderAdminEmail(adminEmails, order)`
  — sent to every `User` with `role: "ADMIN"` (schema.prisma's `Role`
  enum has no separate super-admin role, so "superadmin and admin"
  from the request is just every ADMIN row; today that's the single
  `ADMIN_SEED_EMAIL` account, but it'll pick up any future admins).
- `app/api/public/orders/route.ts`: after order creation, looks up
  all ADMIN emails and fires the notification email. Same
  best-effort try/catch as the existing buyer tracking email right
  above it — a failed admin email must never fail checkout.
- `lib/admin-notifications.ts`: added an `"ORDER"` notification type
  alongside APPLICATION/CREATOR/WITHDRAWAL, querying the 8 most
  recent `PLACED` (undelivered, non-deleted) orders so a new order
  shows up in the admin bell as an action-queue item, same as
  pending applications/withdrawals.
- `app/admin/notifications-bell.tsx`: mapped `ORDER` to a
  `ShoppingBag` icon on a mint tile (teal/blue/peach were already
  taken by the other three types).
- Verified end-to-end against the local dev DB: POSTed a real order
  through `/api/public/orders`, confirmed it returned 201 with no
  errors, then deleted the test order row afterward. SMTP in `.env`
  points at real Gmail (not the local Mailpit catcher), so this did
  send one live email to the seeded admin — worth checking that
  inbox to confirm formatting looks right.

## Completed (2026-07-29 — Commission auto-paid on delivery)

- `lib/commission/index.ts`'s `maybeCreateCommission` now creates
  the Commission directly as `status: "PAID"` with `paidAt: new
  Date()`, instead of `PENDING`. Decided 2026-07-29, explicitly
  requested by admin: delivery should auto-pay the creator rather
  than leaving a separate "Mark Paid" step in the Commissions list.
- This is a UI-level simplification only — no payment gateway
  exists (COD, per architecture.md invariant 4), so "Paid" now
  records that the admin's offline payout is considered settled at
  the moment of delivery, not that a real transaction happened.
- `markCommissionPaid` / `PATCH /api/admin/commissions/[id]/pay`
  and the Commissions page's "Mark Paid" button were left in place
  unchanged — they still work for any commission created before
  this change (which would be PENDING), but no new commission will
  ever need them.
- Updated `context/architecture.md`: invariant 2, and the
  `lib/commission`/`app/admin`/Admin-role rows in the responsibility
  and actor tables, to describe the new Delivered→Paid flow. This
  also fixed a pre-existing doc gap — those sections still described
  the *original* two-step Delivered+cash-reconciled trigger, which
  had already been superseded on 2026-07-28 but never written back
  to architecture.md.
- Verified with a throwaway script against the local dev DB (not
  committed): created a test order, set it Delivered, called
  `maybeCreateCommission`, confirmed the resulting row was
  `status: "PAID"` with `paidAt` set, then deleted the test
  order/commission and restored the product's stock.

## Completed (2026-07-29 — Invoices are admin-only)

- Deleted `app/creator/orders/[id]/invoice/` (`page.tsx` +
  `invoice-actions.tsx`) entirely — admin explicitly asked that only
  admin can see order invoices, not creators. These files were
  already committed (`fb8ba8c`), so they're recoverable from git
  history if ever needed; nothing was lost.
- Removed the "Invoice" link from
  `app/creator/earnings/earnings-history.tsx` that pointed at the
  now-deleted route, and dropped the now-dead `orderId` field from
  `HistoryItem` (and the two places `app/creator/earnings/page.tsx`
  set it, including trimming `order.id` out of the commission
  `select`).
- `app/admin/orders/[id]/invoice/` is untouched — that's the only
  invoice view left in the app, admin-only via `requireAdmin()`.
