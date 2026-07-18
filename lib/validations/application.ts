import { z } from "zod";

export const createApplicationSchema = z.object({
  productId: z.string().trim().min(1),
});

export const decideApplicationSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
});
