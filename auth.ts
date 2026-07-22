import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyOtpCode } from "@/lib/otp";
import type { Role } from "@/generated/prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Accept non-localhost host headers (IP/domain) when running behind
  // a proxy or direct server IP in production.
  trustHost: true,
  // Credentials providers can't use database sessions — JWT is
  // required here, and it also means Google OAuth doesn't need the
  // Session table either (the adapter is still used for User /
  // Account linkage).
  session: { strategy: "jwt" },
  providers: [
    Google({
      // Both providers independently verify ownership of the same
      // email address before a sign-in succeeds (Google via OAuth,
      // "otp" via a mailed code) — that's what normally makes
      // automatic email-based account linking unsafe, and it's
      // exactly why it's safe here.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "otp",
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const code = credentials?.code;
        if (typeof email !== "string" || typeof code !== "string") {
          return null;
        }

        const valid = await verifyOtpCode(email, code);
        if (!valid) return null;

        // First successful code for an email creates the account
        // (role defaults to CREATOR). The seeded admin account is
        // pre-created with role ADMIN by prisma/seed.ts, so signing
        // in with that email attaches to the existing row instead
        // of creating a new creator.
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
