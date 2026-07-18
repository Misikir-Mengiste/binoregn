"use client";

import { CalendarDays, Filter, ListFilter } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";

export function TableToolbar({
  query,
  onQueryChange,
  searchPlaceholder,
  status,
  onStatusChange,
  statusOptions,
  showDateRange = true,
  showMoreFilter = true,
  trailing,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: { value: string; label: string }[];
  showDateRange?: boolean;
  showMoreFilter?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
      <div className="min-w-[220px] flex-1">
        <SearchInput
          value={query}
          onChange={onQueryChange}
          placeholder={searchPlaceholder}
          wide
        />
      </div>
      {status !== undefined && onStatusChange && statusOptions ? (
        <div className="relative">
          <ListFilter className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 appearance-none rounded-[8px] border border-border bg-card pr-8 pl-9 text-sm text-ink-600 outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {showDateRange ? (
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-border bg-card px-3 text-sm text-ink-600"
        >
          <CalendarDays className="h-3.5 w-3.5 text-ink-400" />
          All time
        </button>
      ) : null}
      {showMoreFilter ? (
        <Button type="button" variant="outline" className="h-9 bg-card">
          <Filter className="h-3.5 w-3.5" />
          More Filter
        </Button>
      ) : null}
      {trailing}
    </div>
  );
}
