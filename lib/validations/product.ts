import { z } from "zod";

// imageUrls stores plain URL/path strings — either a local `/uploads/...`
// path written by POST /api/admin/uploads, or an external http(s) URL
// pasted by the admin. `z.url()` only accepts absolute URLs and would
// reject the local upload path, so validate for either shape here. The DB
// only ever stores references, never binaries (architecture.md).
const imageRef = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith("/"),
    { message: "Image must be a full URL or an uploaded /uploads path" },
  );

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(50000).optional(),
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
  imageUrls: z.array(imageRef).default([]),
  stock: z.number().int().nonnegative().default(100),
  isPublished: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();
