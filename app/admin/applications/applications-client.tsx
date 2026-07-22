"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { TableToolbar } from "@/components/table-toolbar";
import { Pagination } from "@/components/pagination";
import { InitialsAvatar } from "@/components/initials-avatar";

type ApplicationRow = {
  id: string;
  status: string;
  createdAt: Date;
  creator: { id: string; email: string; name: string | null };
  product: { name: string; imageUrls: string[] };
};

const PAGE_SIZE = 8;

export function ApplicationsClient({
  applications: allApplications,
}: {
  applications: ApplicationRow[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const applications = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allApplications.filter((application) => {
      if (status !== "ALL" && application.status !== status) return false;
      if (!q) return true;
      return (
        application.product.name.toLowerCase().includes(q) ||
        application.creator.email.toLowerCase().includes(q) ||
        (application.creator.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [allApplications, query, status]);

  const pageCount = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const pageItems = applications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setPendingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? "Could not update the application",
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
      <TableToolbar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        searchPlaceholder="Search applications…"
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        statusOptions={[
          { value: "ALL", label: "All Status" },
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
        ]}
      />
      {error && (
        <p className="px-5 pt-3 text-sm text-destructive">{error}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="bg-surface-100 text-xs text-ink-400">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Creator</th>
              <th className="px-5 py-3 font-medium">Applied</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((application) => (
              <tr key={application.id} className="border-t border-border">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {application.product.imageUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={application.product.imageUrls[0]}
                        alt=""
                        className="h-10 w-10 rounded-[8px] object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-[8px] bg-teal-100" />
                    )}
                    <p className="font-semibold text-foreground">
                      {application.product.name}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/admin/creators/${application.creator.id}`}
                    className="group flex items-center gap-2.5"
                  >
                    <InitialsAvatar
                      email={application.creator.email}
                      size="sm"
                    />
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-teal-700 group-hover:underline">
                        {application.creator.name ?? application.creator.email}
                      </p>
                      <p className="text-xs text-ink-400">
                        {application.creator.email}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-ink-600">
                  {new Date(application.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={application.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/creators/${application.creator.id}`}
                      className="inline-flex h-8 items-center rounded-[8px] border border-border bg-card px-3 text-sm font-medium text-ink-600 hover:text-teal-700"
                    >
                      View
                    </Link>
                    {application.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          className="h-8 rounded-[8px]"
                          disabled={pendingId === application.id}
                          onClick={() => decide(application.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-[8px] bg-card"
                          disabled={pendingId === application.id}
                          onClick={() => decide(application.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  {allApplications.length === 0
                    ? "No applications yet."
                    : "No applications match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
