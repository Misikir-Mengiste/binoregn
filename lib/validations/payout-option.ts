import { z } from "zod";

export const createPayoutOptionSchema = z.object({
  category: z.enum(["BANK", "WALLET"]),
  name: z.string().trim().min(1).max(120),
});

export const updatePayoutOptionSchema = z.object({
  isActive: z.boolean(),
});
