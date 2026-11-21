import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PendingApprovalCard } from "@/components/pending-approval-card";

export default async function OnboardingPendingPage() {
  const session = await auth();
  let rejected = false;

  // Reachable two ways: (1) a signed-in creator mid-flow, checked against
  // their real record below, or (2) an unauthenticated visitor who just
  // entered the email of an existing pending application on the sign-in
  // screen (see /api/auth/request-otp) — that case has no session to
  // check, so it just gets the generic card as-is.
  if (session?.user) {
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
    rejected = creator.creatorProfileStatus === "REJECTED";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      {rejected ? (
        <PendingApprovalCard
          rejected
          title="Profile not approved"
          description="Your creator profile wasn't approved this time. Contact us if you think this is a mistake or want to update your details."
        />
      ) : (
        <PendingApprovalCard showDashboardLink={false} />
      )}
    </main>
  );
}
