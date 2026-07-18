import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

// No `declare module "next-auth/jwt"` augmentation here: that
// module only re-exports (`export * from "@auth/core/jwt"`) rather
// than declaring JWT locally, so TypeScript doesn't merge into it.
// auth.ts casts `token.id` / `token.role` at the read site instead.
