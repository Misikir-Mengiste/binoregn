import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Single role-aware landing spot after any sign-in method (OTP,
// password, Google) — used as the universal post-sign-in
// destination so the redirect logic exists in exactly one place
// instead of being duplicated (and drifting) across three sign-in
// flows.
export default async function DashboardRedirect() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const creator = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { creatorOnboardingCompletedAt: true, creatorProfileStatus: true },
  });

  if (!creator?.creatorOnboardingCompletedAt) {
    redirect("/onboarding");
  }

  if (creator.creatorProfileStatus !== "APPROVED") {
    redirect("/onboarding/pending");
  }

  redirect("/creator");
}
