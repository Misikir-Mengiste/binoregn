"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/search-input";

type ApplicationRow = {
  id: string;
  status: string;
  createdAt: Date;
  product: { name: string; priceBirr: number; commissionBirr: number };
};

export function ApplicationsListClient({
  applications: allApplications,
}: {
  applications: ApplicationRow[];
}) {
  const [query, setQuery] = useState("");

  const applications = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allApplications;
    return allApplications.filter((application) =>
      application.product.name.toLowerCase().includes(q),
    );
  }, [allApplications, query]);

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search applications…"
      />
      {applications.map((application) => (
        <div
          key={application.id}
          className="flex items-center justify-between rounded-md bg-card p-4 shadow-card"
        >
          <div>
            <p className="text-[13.5px] font-semibold text-foreground">
              {application.product.name}
            </p>
            <p className="text-xs text-ink-600">
              {application.product.priceBirr} Birr ·{" "}
              {application.product.commissionBirr} Birr commission · Applied{" "}
              {new Date(application.createdAt).toLocaleDateString()}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      ))}
      {applications.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {allApplications.length === 0
            ? "You haven't applied to any products yet."
            : "No applications match your search."}
        </p>
      )}
    </div>
  );
}
