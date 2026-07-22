import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationsListClient } from "./applications-list-client";

export default async function CreatorApplicationsPage() {
  const session = await auth();
  const creatorId = session!.user.id;

  const applications = await prisma.application.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      product: {
        select: {
          name: true,
          priceBirr: true,
          commissionBirr: true,
          imageUrls: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-sm text-ink-400">
          Track the products you&apos;ve applied to promote.
        </p>
      </div>
      <ApplicationsListClient applications={applications} />
    </div>
  );
}
