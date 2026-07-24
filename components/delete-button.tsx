"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shared confirm-then-delete control for admin list rows — icon button
// that expands into a Confirm/Cancel pair before actually calling
// onDelete, so a misclick can't remove a row outright.
export function DeleteButton({
  onDelete,
  label = "Delete",
}: {
  onDelete: () => Promise<void>;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="destructive"
          className="h-8 rounded-[8px]"
          disabled={loading}
          onClick={handleConfirm}
        >
          {loading ? "…" : "Confirm"}
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
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <Button
      size="icon-sm"
      variant="outline"
      aria-label={label}
      title={label}
      className="rounded-[8px] bg-card text-destructive hover:bg-destructive/10"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
