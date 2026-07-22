import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreatorOnboardingForm } from "@/components/creator-onboarding-form";

export default async function CreatorOnboardingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  if (session.user.role !== "CREATOR") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      creatorUsername: true,
      creatorPhone: true,
      creatorDisplayName: true,
      creatorPlatform: true,
      creatorProfileUrl: true,
      creatorCategory: true,
      creatorProfileStatus: true,
      payoutMethod: true,
      payoutAccountNumber: true,
      payoutAccountName: true,
      payoutBankName: true,
      creatorOnboardingCompletedAt: true,
      email: true,
    },
  });

  if (user?.creatorOnboardingCompletedAt) {
    if (user.creatorProfileStatus !== "APPROVED") {
      redirect("/onboarding/pending");
    }
    redirect("/creator");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <CreatorOnboardingForm
        email={user?.email ?? ""}
        initialValues={{
          fullName: user?.name ?? "",
          username: user?.creatorUsername ?? "",
          phone: user?.creatorPhone?.replace("+251", "") ?? "",
          displayName: user?.creatorDisplayName ?? "",
          platform: user?.creatorPlatform ?? "",
          profileUrl: user?.creatorProfileUrl ?? "",
          category: user?.creatorCategory
            ? user.creatorCategory[0] + user.creatorCategory.slice(1).toLowerCase()
            : "",
          payoutMethod: user?.payoutMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "TELEBIRR",
          telebirrPhone:
            user?.payoutMethod === "TELEBIRR"
              ? user?.payoutAccountNumber?.replace("+251", "") ?? ""
              : "",
          bankName: user?.payoutBankName ?? "",
          bankAccountName: user?.payoutAccountName ?? "",
          bankAccountNumber: user?.payoutAccountNumber ?? "",
        }}
      />
    </main>
  );
}
