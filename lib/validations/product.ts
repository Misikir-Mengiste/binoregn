import { z } from "zod";

// imageUrls takes URLs directly rather than handling upload —
// there's no S3/Cloudinary integration wired up yet (see
// doc/backend-api-plan.md Open Question 2). The DB only ever
// stores references either way (architecture.md), so this
// endpoint shape doesn't change once real upload exists.
export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  subCategory: z.string().trim().min(1).max(120).optional(),
  features: z.array(z.string().trim().min(1).max(200)).default([]),
  care: z.array(z.string().trim().min(1).max(200)).default([]),
  shipping: z.array(z.string().trim().min(1).max(200)).default([]),
  returns: z.array(z.string().trim().min(1).max(200)).default([]),
  colors: z.array(z.string().trim().min(1).max(50)).default([]),
  sizes: z.array(z.string().trim().min(1).max(50)).default([]),
  priceBirr: z.number().int().positive(),
  compareAtBirr: z.number().int().positive().optional(),
  rating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().nonnegative().optional(),
  soldCount: z.number().int().nonnegative().optional(),
  sellerName: z.string().trim().min(1).max(200).optional(),
  sellerVerified: z.boolean().optional(),
  sellerRating: z.number().min(0).max(5).optional(),
  sellerSoldCount: z.number().int().nonnegative().optional(),
  shippingDiscountLabel: z.string().trim().min(1).max(200).optional(),
  shippingPackageLabel: z.string().trim().min(1).max(200).optional(),
  shippingDeliveryTime: z.string().trim().min(1).max(200).optional(),
  shippingArrives: z.string().trim().min(1).max(200).optional(),
  commissionBirr: z.number().int().positive(),
  imageUrls: z.array(z.url()).default([]),
});

export const updateProductSchema = createProductSchema.partial();
