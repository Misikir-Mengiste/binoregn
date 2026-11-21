"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Approve / reject a creator's onboarding profile. The creator is
// notified either way (dashboard notification). A rejected profile can
// still be approved later.
export function CreatorApproveButton({
  creatorId,
  canReject = true,
}: {
  creatorId: string;
  canReject?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (
      decision === "REJECTED" &&
      !window.confirm("Reject this creator? They'll be told their profile wasn't approved.")
    ) {
      return;
    }
    setLoading(decision);
    setError(null);
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Unable to update creator");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {canReject ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-[8px]"
            disabled={loading !== null}
            onClick={() => decide("REJECTED")}
          >
            {loading === "REJECTED" ? "Rejecting…" : "Reject"}
          </Button>
        ) : null}
        <Button
          size="sm"
          className="h-8 rounded-[8px]"
          disabled={loading !== null}
          onClick={() => decide("APPROVED")}
        >
          {loading === "APPROVED" ? "Approving…" : "Approve creator"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
