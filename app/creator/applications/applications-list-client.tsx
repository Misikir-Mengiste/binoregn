"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { CreatorStatCard } from "@/components/creator-stat-card";

type ApplicationRow = {
  id: string;
  status: string;
  createdAt: Date;
  product: {
    name: string;
    priceBirr: number;
    commissionBirr: number;
    imageUrls: string[];
  };
};

const PAGE_SIZE = 8;

export function ApplicationsListClient({
  applications: allApplications,
}: {
  applications: ApplicationRow[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    let approved = 0;
    let pending = 0;
    for (const application of allApplications) {
      if (application.status === "APPROVED") approved += 1;
      else if (application.status === "PENDING") pending += 1;
    }
    return { total: allApplications.length, approved, pending };
  }, [allApplications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = allApplications.filter((application) => {
      if (!q) return true;
      return application.product.name.toLowerCase().includes(q);
    });
    return result.sort((a, b) => {
      const aPending = a.status === "PENDING";
      const bPending = b.status === "PENDING";
      if (aPending === bPending) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return aPending ? -1 : 1;
    });
  }, [allApplications, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const applications = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CreatorStatCard
          value={counts.total.toLocaleString()}
          label="Total applications"
          bg="bg-teal-100"
        />
        <CreatorStatCard
          value={counts.approved.toLocaleString()}
          label="Approved"
          bg="bg-mint-100"
        />
        <CreatorStatCard
          value={counts.pending.toLocaleString()}
          label="Pending review"
          bg="bg-peach-100"
        />
      </div>

      <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-foreground">
            Your applications
          </h2>
          <div className="sm:w-64">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Search applications…"
              wide
            />
          </div>
        </div>

        {applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-surface-100 text-xs text-ink-400">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Commission</th>
                  <th className="px-5 py-3 font-medium">Applied</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-surface-100">
                          {application.product.imageUrls[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={application.product.imageUrls[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-teal-100" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {application.product.name}
                          </p>
                          <p className="text-xs text-ink-400">
                            {application.product.priceBirr.toLocaleString()} ETB
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {application.product.commissionBirr.toLocaleString()} ETB
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={application.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            {allApplications.length === 0
              ? "You haven't applied to any products yet."
              : "No applications match your search."}
          </p>
        )}

        {filtered.length > 0 && (
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
