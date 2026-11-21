import { z } from "zod";

// Input for the public (no-auth) checkout endpoint. The buyer never
// supplies productId/creatorId directly — those are derived
// server-side from the affiliate link, per architecture.md
// invariant 5 (immutable order attribution).
export const createOrderSchema = z.object({
  affiliateLinkSlug: z.string().trim().min(1),
  buyerName: z.string().trim().min(1).max(200),
  // Exactly 10 digits, numbers only (e.g. 0912345678).
  buyerPhone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits (numbers only)"),
  buyerAddress: z.string().trim().min(1).max(1000),
  // City is required; notes are the only optional buyer field (no email —
  // confirmation is on-screen only, progress-tracker 2026-11-11).
  buyerCity: z.string().trim().min(1, "Please select a city").max(120),
  buyerNotes: z.string().trim().max(1000).optional(),
  quantity: z.number().int().min(1).max(99).default(1),
  // Required only when the product actually defines that dimension —
  // validated against product.colors/product.sizes server-side, since
  // the client can't be trusted to send one of the real options.
  color: z.string().trim().max(60).optional(),
  size: z.string().trim().max(30).optional(),
  // Creator discount code typed at checkout (lib/discount.ts). Checked
  // against the product server-side; an invalid code fails the order with
  // a clear message rather than silently charging full price.
  discountCode: z.string().trim().max(40).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Admin edit of an existing order (PATCH /api/admin/orders/[id]). Buyer
// contact/delivery details can always be corrected; quantity/colour/size
// only while the order is still PLACED (the route enforces that).
// Attribution (product, creator, affiliate link) is never editable —
// architecture.md invariant 5.
export const updateOrderSchema = z
  .object({
    buyerName: z.string().trim().min(1, "Name is required").max(200),
    buyerPhone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits (numbers only)"),
    buyerCity: z.string().trim().min(1, "Please select a city").max(120),
    buyerAddress: z.string().trim().min(1, "Address is required").max(1000),
    buyerNotes: z.string().trim().max(1000).nullable(),
    quantity: z.number().int().min(1).max(99),
    color: z.string().trim().max(60).nullable(),
    size: z.string().trim().max(30).nullable(),
  })
  .partial();
