import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PendingApprovalCard } from "@/components/pending-approval-card";

export default async function OnboardingPendingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  if (session.user.role !== "CREATOR") {
    redirect("/dashboard");
  }

  const creator = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { creatorProfileStatus: true, creatorOnboardingCompletedAt: true },
  });

  if (!creator?.creatorOnboardingCompletedAt) {
    redirect("/onboarding");
  }
  if (creator.creatorProfileStatus === "APPROVED") {
    redirect("/creator");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <PendingApprovalCard showDashboardLink={false} />
    </main>
  );
}
