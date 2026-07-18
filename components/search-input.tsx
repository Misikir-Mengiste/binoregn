"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  wide = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full", !wide && "max-w-xs", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-[8px] border-border bg-card pl-9 text-sm"
      />
    </div>
  );
}
