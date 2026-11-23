import { z } from "zod";

export const createPayoutOptionSchema = z.object({
  category: z.enum(["BANK", "WALLET"]),
  name: z.string().trim().min(1).max(120),
});

// Either field may be sent: the Activate/Deactivate button or a logo
// upload (logoUrl: an /api/uploads/… or /images/… path; null removes it).
export const updatePayoutOptionSchema = z
  .object({
    isActive: z.boolean().optional(),
    logoUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v.startsWith("/"), "Logo must be an uploaded image")
      .nullable()
      .optional(),
  })
  .refine((d) => d.isActive !== undefined || d.logoUrl !== undefined, "Nothing to update");
