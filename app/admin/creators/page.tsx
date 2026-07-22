import { prisma } from "@/lib/prisma";
import { CreatorsClient } from "./creators-client";

export default async function AdminCreatorsPage() {
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
    },
  });

  return <CreatorsClient creators={creators} />;
}
