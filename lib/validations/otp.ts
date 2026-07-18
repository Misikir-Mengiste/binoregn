import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.email().trim().toLowerCase(),
});
