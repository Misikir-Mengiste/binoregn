import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  showMoreActions = false,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  showMoreActions?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} />
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] leading-tight font-bold text-foreground sm:text-[28px]">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-ink-400">{description}</p>
          ) : null}
        </div>
        {(actions || showMoreActions) && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {showMoreActions ? (
              <Button type="button" variant="outline" className="bg-card">
                More Actions
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
