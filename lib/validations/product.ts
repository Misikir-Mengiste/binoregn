import { z } from "zod";

// imageUrls takes URLs directly rather than handling upload —
// there's no S3/Cloudinary integration wired up yet (see
// doc/backend-api-plan.md Open Question 2). The DB only ever
// stores references either way (architecture.md), so this
// endpoint shape doesn't change once real upload exists.
export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  priceBirr: z.number().int().positive(),
  commissionBirr: z.number().int().positive(),
  imageUrls: z.array(z.url()).default([]),
});

export const updateProductSchema = createProductSchema.partial();
