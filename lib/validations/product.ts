import { z } from "zod";

// imageUrls stores plain URL/path strings — either a local
// `/uploads/...` path written by POST /api/admin/uploads, or an
// external URL pasted by the admin. The DB only ever stores
// references, never binaries (architecture.md).
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
