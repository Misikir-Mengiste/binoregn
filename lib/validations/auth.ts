import { z } from "zod";

export const signUpSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(200).optional(),
});

export const passwordSignInSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});
