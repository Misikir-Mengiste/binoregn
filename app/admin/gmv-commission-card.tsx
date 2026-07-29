"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PeriodTotals } from "@/lib/dashboard";

const PERIODS: { key: keyof PeriodTotals; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "lifetime", label: "Lifetime" },
];

function birr(amount: number) {
  return `${amount.toLocaleString()} ETB`;
}

/** GMV vs. total commission paid, toggled between the same four trailing windows. */
export function GmvCommissionCard({
  gmv,
  commissionPaid,
}: {
  gmv: PeriodTotals;
  commissionPaid: PeriodTotals;
}) {
  const [period, setPeriod] = useState<keyof PeriodTotals>("monthly");

  return (
    <div className="rounded-[10px] border border-border bg-card p-5 shadow-card">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-foreground">
            GMV &amp; Commission Paid
          </h2>
          <p className="text-xs text-ink-400">
            Delivered order value vs. commissions paid out
          </p>
        </div>
        <div className="inline-flex rounded-[8px] border border-border bg-surface-100 p-1">
          {PERIODS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setPeriod(option.key)}
              className={cn(
                "rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors",
                period === option.key
                  ? "bg-card text-foreground shadow-card"
                  : "text-ink-600 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[8px] border border-border p-4">
          <p className="text-xs text-ink-400">GMV</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {birr(gmv[period])}
          </p>
          <div className="mt-2 h-[3px] w-10 rounded-pill bg-teal-500" />
        </div>
        <div className="rounded-[8px] border border-border p-4">
          <p className="text-xs text-ink-400">Total Commission Paid</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {birr(commissionPaid[period])}
          </p>
          <div className="mt-2 h-[3px] w-10 rounded-pill bg-orange-500" />
        </div>
      </div>
    </div>
  );
}
