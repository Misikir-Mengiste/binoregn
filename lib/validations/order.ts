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
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
