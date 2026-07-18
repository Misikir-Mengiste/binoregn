import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-peach-100 text-peach-700",
  APPROVED: "bg-mint-100 text-mint-500",
  REJECTED: "bg-coral-100 text-coral-500",
  PLACED: "bg-peach-100 text-peach-700",
  DELIVERED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-coral-100 text-coral-500",
  RETURNED: "bg-coral-100 text-coral-500",
  PAID: "bg-teal-100 text-teal-700",
};

const DOT: Record<string, string> = {
  PENDING: "bg-peach-700",
  APPROVED: "bg-mint-500",
  REJECTED: "bg-coral-500",
  PLACED: "bg-peach-700",
  DELIVERED: "bg-blue-700",
  CANCELLED: "bg-coral-500",
  RETURNED: "bg-coral-500",
  PAID: "bg-teal-700",
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PLACED: "Pending",
  DELIVERED: "Completed",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  PAID: "Paid",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-pill",
          DOT[status] ?? "bg-muted-foreground",
        )}
      />
      {LABELS[status] ?? status}
    </span>
  );
}
