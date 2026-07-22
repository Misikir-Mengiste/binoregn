import { z } from "zod";

export const withdrawalRequestSchema = z.object({
  amountBirr: z.number().int().positive(),
  payoutMethod: z.enum(["TELEBIRR", "BANK_TRANSFER"]),
});
