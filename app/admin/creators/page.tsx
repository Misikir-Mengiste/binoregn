import { prisma } from "@/lib/prisma";
import { CreatorsClient } from "./creators-client";
import { requireAdminPage } from "@/lib/auth-helpers";

export default async function AdminCreatorsPage() {
  await requireAdminPage();
  const creators = await prisma.user.findMany({
    where: { role: "CREATOR", creatorOnboardingCompletedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      creatorUsername: true,
      creatorDisplayName: true,
      creatorPlatform: true,
      creatorCategory: true,
      creatorProfileStatus: true,
      createdAt: true,
      isActive: true,
    },
  });

  return <CreatorsClient creators={creators} />;
}
