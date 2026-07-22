import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreatorShell } from "./creator-shell";
import { prisma } from "@/lib/prisma";
import { getCreatorNotifications } from "@/lib/creator-notifications";

// Real folder (not a route group), matching app/admin's decision —
// keeps /creator/* as a genuine URL prefix.
export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (session.user.role !== "CREATOR") {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center px-6">
        <p className="text-ink-600">
          You don&apos;t have access to this page.
        </p>
      </main>
    );
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

  const notifications = await getCreatorNotifications(session.user.id);

  return (
    <CreatorShell
      email={session.user.email ?? ""}
      notifications={notifications}
    >
      {children}
    </CreatorShell>
  );
}
