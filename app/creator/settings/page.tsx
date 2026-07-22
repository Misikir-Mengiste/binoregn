import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { InitialsAvatar } from "@/components/initials-avatar";
import { CreatorSettingsForm } from "@/components/creator-settings-form";

export default async function CreatorSettingsPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      name: true,
      creatorUsername: true,
      creatorPhone: true,
      creatorDisplayName: true,
      creatorPlatform: true,
      creatorProfileUrl: true,
      creatorCategory: true,
      payoutMethod: true,
      payoutAccountNumber: true,
      payoutAccountName: true,
      payoutBankName: true,
    },
  });

  const displayName =
    user?.creatorDisplayName || user?.name || user?.creatorUsername || "Creator";
  const profileMeta = [
    user?.creatorUsername ? `@${user.creatorUsername}` : null,
    user?.creatorPlatform,
    user?.creatorCategory,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Update your creator profile and payout details."
        breadcrumbs={[{ label: "Settings" }]}
      />

      <div className="flex flex-wrap items-center gap-4 rounded-[16px] border border-border bg-card p-5 shadow-card">
        <InitialsAvatar email={email} />
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">
            {displayName}
          </p>
          {profileMeta ? (
            <p className="truncate text-sm text-ink-400">{profileMeta}</p>
          ) : null}
        </div>
      </div>
      <CreatorSettingsForm
        initialValues={{
          fullName: user?.name ?? "",
          username: user?.creatorUsername ?? "",
          phone: user?.creatorPhone?.replace("+251", "") ?? "",
          displayName: user?.creatorDisplayName ?? "",
          platform: user?.creatorPlatform ?? "",
          profileUrl: user?.creatorProfileUrl ?? "",
          category: user?.creatorCategory
            ? user.creatorCategory[0] + user.creatorCategory.slice(1).toLowerCase()
            : "Other",
          payoutMethod: user?.payoutMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "TELEBIRR",
          telebirrPhone:
            user?.payoutMethod === "TELEBIRR"
              ? user?.payoutAccountNumber?.replace("+251", "") ?? ""
              : "",
          bankName: user?.payoutBankName ?? "Other",
          bankAccountName: user?.payoutAccountName ?? "",
          bankAccountNumber: user?.payoutAccountNumber ?? "",
        }}
      />
    </div>
  );
}
