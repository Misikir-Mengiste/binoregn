# Affiliate Marketplace

## Overview

Affiliate Marketplace is a single-seller platform where one admin lists physical products with a fixed Birr commission, creators apply to promote those products, and after admin approval they get a unique affiliate link. Buyers land on a creator-attributed product page, place an order with no online payment (cash-on-delivery / manual fulfillment). Once the admin has both marked the order Delivered and separately reconciled that the COD cash was actually collected, the creator earns a pending commission that the admin later marks Paid. The product is for creators who want to monetize referrals and for the seller/admin who needs approval control, order tracking, and manual payouts — without a payment gateway or multi-vendor marketplace.

## Goals

1. Let creators discover products, apply to promote them, and receive a unique affiliate link only after admin approval.
2. Attribute every public checkout to exactly one creator+product pair and keep that attribution immutable after order placement.
3. Support a no-payment checkout where the admin manually updates order status (Placed → Delivered / Cancelled / Returned).
4. Create commission only when an order is marked Delivered AND its COD cash has been separately reconciled by the admin, at the product's fixed Birr amount, and allow the admin to mark that commission Paid.
5. Ship three surfaces in one Next.js app: public landing/checkout, creator dashboard, and admin dashboard.

## Core User Flow

1. Admin seeds/signs in as the fixed admin account and creates a product (name, price, fixed Birr commission, images).
2. Creator signs in passwordlessly (Google or email OTP) and browses the product catalog.
3. Creator applies to promote a product; application status is Pending until the admin acts.
4. Admin approves or rejects the application. On approval, the system generates an affiliate link for that creator+product pair.
5. Creator copies their link and shares it; buyers open the creator-attributed public product page (no auth required).
6. Buyer completes checkout without online payment; the order is stored with immutable creator attribution and status Placed; commission is not created yet.
7. Admin fulfills the order and marks it Delivered (or Cancelled/Returned). Separately, once the admin reconciles that the COD cash for that order was actually collected, the commission becomes Pending for the attributed creator at the fixed Birr amount (Delivered + cash-reconciled are two independent admin actions — order of the two doesn't matter, but both must be true). Cancelled/Returned never create a commission, and a Delivered order without reconciled cash stays commission-None.
8. Admin pays the creator offline and marks the commission Paid. Creator sees applications, links, and earnings (pending vs paid) in their dashboard.

## Features

### Public (buyer)

- Creator-attributed product landing page via affiliate link
- No-payment checkout that places an order and locks creator attribution
- No buyer accounts required
- Optional email for order tracking link + public order tracking page

### Creator

- Passwordless sign-in (Google OAuth or 6-digit email OTP)
- Browse product catalog
- Product page in the same design buyers see, plus a commission badge ("You earn X Birr per delivered sale") and one button: Request to Promote → Waiting for Approval → Copy Link + Share (or Not Approved / Full)
- Request a product again 7 days after a rejection
- See how many creator spots are left on a product (admin sets a per-product limit; only approved creators use a spot)
- View and copy affiliate links only for approved products
- View own earnings: pending and paid commission totals (never other creators’ data)
- Complete creator onboarding: name, username, platform presence, and payout details
- See the next Friday payout (amount and date); payouts cover commissions pending by Thursday 11:59 PM, minimum 500 Birr, smaller amounts roll over
- View printable invoices for own referred orders (non-tax receipt)

### Admin

- Fixed/seeded admin identity (not creator self-registration)
- Product CRUD including image upload and detailed sections (category, sub-category, features, care, shipping, returns, colors, sizes)
- Approve or reject creator applications (manual, with confirmation)
- Approve creator onboarding profiles before dashboard access
- Update order delivery status (Placed, Delivered, Cancelled, Returned)
- Mark an order's COD cash as reconciled/collected — a separate manual action from marking it Delivered
- Mark commissions Paid after offline payout
- Generate printable order invoices for buyers (non-tax receipt)
- Friday payouts: see who is due, download the payout list as Excel, mark creators paid
- Dashboard signals for pending commissions, paid totals, and new applications

### Commission and attribution rules

- Fixed Birr commission per product (not a percentage)
- Commission lifecycle: None → Pending → Paid (forward-only)
- Pending only once an order is BOTH Delivered AND cash-reconciled; Cancelled/Returned produce no commission; Delivered-but-unreconciled stays at None
- Delivery status and cash-reconciliation are separate fields, set by separate admin actions — never inferred from one another
- Order status and commission status are separate fields and separate UI badges
- No automated payment gateway or logistics webhooks in the MVP

## Scope

### In Scope

- Single-seller model (one admin/seller, many creators)
- Next.js + TypeScript app with public, creator, and admin route groups
- NextAuth passwordless auth for creators; seeded admin account
- Prisma + PostgreSQL for products, creators, applications, affiliate links, orders, and commissions
- Product image storage on the local filesystem (`public/uploads/`), no third-party service
- Manual order fulfillment and manual commission payout marking
- Fixed Birr commissions and delivered-only commission trigger
- Printable order invoice view for admin (non-tax receipt)
- Design system adapted for product cards, status badges, and creator/admin dashboards

### Out of Scope

- Multi-vendor / multi-seller marketplace
- Online payment gateway, escrow, or automated payouts
- Logistics carrier integrations or delivery webhooks
- Percentage-based or tiered commission schemes
- Buyer accounts, reviews, ratings, or wishlist
- Creator-to-creator messaging or social feeds
- Automated affiliate link generation before application approval
- Self-serve admin registration or multi-admin RBAC
- Mobile native apps
- Tax invoicing, KYC, or formal compliance tooling

## Success Criteria

1. A signed-in creator can apply to a product and, after admin approval, see a unique affiliate link for that product only.
2. A buyer can place an order through a creator link with no online payment, and the order’s creator attribution cannot be changed afterward.
3. Marking an order Delivered AND separately reconciling its cash creates exactly one Pending commission at the product's fixed Birr amount for the attributed creator; Cancelled/Returned never create a commission, and Delivered alone (without cash reconciliation) never creates one either.
4. Admin can mark a Pending commission Paid, and the creator dashboard reflects pending vs paid totals for their own data only.
5. Creators cannot create/edit products or see other creators’ applications, links, or earnings; only the admin can mutate catalog, approvals, order status, and commission payout status.
6. `npm run build` succeeds with the public, creator, and admin flows wired against the Prisma schema and the invariants in `architecture.md`.