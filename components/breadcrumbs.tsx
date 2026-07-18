import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-sm">
      <Link
        href="/admin"
        className="text-ink-400 transition-colors hover:text-teal-600"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            <span className="text-ink-400">/</span>
            {item.href && !last ? (
              <Link
                href={item.href}
                className="text-ink-400 transition-colors hover:text-teal-600"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(last ? "font-medium text-teal-600" : "text-ink-400")}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
