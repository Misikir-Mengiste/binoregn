import { z } from "zod";

// Input for the public (no-auth) checkout endpoint. The buyer never
// supplies productId/creatorId directly — those are derived
// server-side from the affiliate link, per architecture.md
// invariant 5 (immutable order attribution).
export const createOrderSchema = z.object({
  affiliateLinkSlug: z.string().trim().min(1),
  buyerName: z.string().trim().min(1).max(200),
  buyerPhone: z.string().trim().min(1).max(50),
  buyerAddress: z.string().trim().min(1).max(1000),
  // City is required; email and notes are the only optional buyer fields.
  buyerCity: z.string().trim().min(1, "Please select a city").max(120),
  buyerEmail: z.string().trim().email().optional(),
  buyerNotes: z.string().trim().max(1000).optional(),
  quantity: z.number().int().min(1).max(99).default(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
