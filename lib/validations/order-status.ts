import { z } from "zod";

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(["DELIVERED", "CANCELLED", "RETURNED"]),
});

export const updateFulfillmentStatusSchema = z.object({
  status: z.enum(["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"]),
});
