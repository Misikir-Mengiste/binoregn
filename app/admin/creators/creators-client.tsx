"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import { CreatorDeactivateButton } from "./[id]/creator-deactivate-button";

type CreatorRow = {
  id: string;
  name: string | null;
  email: string;
  creatorUsername: string | null;
  creatorDisplayName: string | null;
  creatorPlatform: string | null;
  creatorCategory: string | null;
  creatorProfileStatus: string | null;
  createdAt: Date;
  isActive: boolean;
};

export function CreatorsClient({ creators }: { creators: CreatorRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => creators.filter((creator) => creator.creatorProfileStatus === "PENDING").length,
    [creators],
  );
  const approvedCount = useMemo(
    () => creators.filter((creator) => creator.creatorProfileStatus === "APPROVED").length,
    [creators],
  );

  async function handleApprove(id: string) {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/admin/creators/${id}/approve`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Unable to approve creator");
      }
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Creators"
        description="Review creator onboarding submissions."
        breadcrumbs={[{ label: "Creators" }]}
      />
      <KpiStrip
        items={[
          {
            label: "Pending approval",
            value: pendingCount.toLocaleString("en-US"),
            icon: Clock,
            accent: "orange",
          },
          {
            label: "Approved",
            value: approvedCount.toLocaleString("en-US"),
            icon: CheckCircle2,
            accent: "mint",
          },
        ]}
      />

      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Username</th>
                <th className="px-5 py-3 font-medium">Platform</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((creator) => (
                <tr key={creator.id} className="border-t border-border">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-foreground">
                      {creator.creatorDisplayName || creator.name || "—"}
                    </p>
                    <p className="text-xs text-ink-400">{creator.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ink-600">
                    {creator.creatorUsername ? `@${creator.creatorUsername}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ink-600">
                    {creator.creatorPlatform ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ink-600">
                    {creator.creatorCategory ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {!creator.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                        <span className="h-1.5 w-1.5 rounded-pill bg-destructive" />
                        Deactivated
                      </span>
                    ) : creator.creatorProfileStatus === "APPROVED" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-mint-100 px-2.5 py-1 text-xs font-medium text-mint-500">
                        <span className="h-1.5 w-1.5 rounded-pill bg-mint-500" />
                        Approved
                      </span>
                    ) : creator.creatorProfileStatus === "REJECTED" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-coral-100 px-2.5 py-1 text-xs font-medium text-coral-500">
                        <span className="h-1.5 w-1.5 rounded-pill bg-coral-500" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-peach-100 px-2.5 py-1 text-xs font-medium text-peach-700">
                        <span className="h-1.5 w-1.5 rounded-pill bg-peach-700" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/creators/${creator.id}`}
                        className="inline-flex h-8 items-center rounded-[8px] border border-border bg-card px-3 text-sm font-medium text-ink-600 hover:text-teal-700"
                      >
                        View
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-[8px] bg-card"
                        disabled={
                          creator.creatorProfileStatus === "APPROVED" || loadingId === creator.id
                        }
                        onClick={() => handleApprove(creator.id)}
                      >
                        {creator.creatorProfileStatus === "APPROVED"
                          ? "Approved"
                          : loadingId === creator.id
                            ? "Approving…"
                            : "Approve"}
                      </Button>
                      <CreatorDeactivateButton
                        creatorId={creator.id}
                        isActive={creator.isActive}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {creators.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No creator submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
