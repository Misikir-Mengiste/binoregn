import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import { ApplicationsClient } from "./applications-client";

export default async function AdminApplicationsPage() {
  const [applications, pending, approved, rejected] = await Promise.all([
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        creator: { select: { id: true, email: true, name: true } },
        product: { select: { name: true, imageUrls: true } },
      },
    }),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.application.count({ where: { status: "APPROVED" } }),
    prisma.application.count({ where: { status: "REJECTED" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Applications"
        description="Review creator applications to promote products."
        breadcrumbs={[{ label: "Applications" }]}
        showMoreActions
      />
      <KpiStrip
        items={[
          {
            label: "Pending",
            value: pending.toLocaleString(),
            icon: Clock,
            accent: "orange",
          },
          {
            label: "Approved",
            value: approved.toLocaleString(),
            icon: CheckCircle2,
            accent: "mint",
          },
          {
            label: "Rejected",
            value: rejected.toLocaleString(),
            icon: XCircle,
            accent: "coral",
          },
        ]}
      />
      <ApplicationsClient applications={applications} />
    </div>
  );
}
