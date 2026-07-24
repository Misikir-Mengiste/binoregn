"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CreatorDeactivateButton({
  creatorId,
  isActive,
}: {
  creatorId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        isActive
          ? `/api/admin/creators/${creatorId}`
          : `/api/admin/creators/${creatorId}/reactivate`,
        { method: isActive ? "DELETE" : "PATCH" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? "Unable to update creator status",
        );
      }
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!isActive) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-[8px] bg-card"
          disabled={loading}
          onClick={handleToggle}
        >
          {loading ? "Reactivating…" : "Reactivate creator"}
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-600">Deactivate this creator?</span>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 rounded-[8px]"
            disabled={loading}
            onClick={handleToggle}
          >
            {loading ? "Deactivating…" : "Confirm"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-[8px] bg-card"
            disabled={loading}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      className="h-8 rounded-[8px]"
      onClick={() => setConfirming(true)}
    >
      Deactivate creator
    </Button>
  );
}
