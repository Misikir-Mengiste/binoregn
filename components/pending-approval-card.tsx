import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/site";

export function PendingApprovalCard({
  title = "Application submitted",
  description = "Thank you for applying. Your creator profile is now under review.",
  showDashboardLink = false,
  rejected = false,
}: {
  title?: string;
  description?: string;
  showDashboardLink?: boolean;
  rejected?: boolean;
}) {
  return (
    <div className="w-full max-w-sm rounded-[18px] bg-card px-6 py-10 text-center shadow-card">
      <Logo className="mx-auto mb-7 h-7" />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-teal-700 text-white">
        <span className="text-2xl">✓</span>
      </div>
      <p className="mt-5 text-xl font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-ink-600">{description}</p>

      <div className="mt-6 rounded-[14px] border border-border px-4 py-3 text-left text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-600">Status</span>
          {rejected ? (
            <span className="inline-flex items-center gap-2 rounded-pill bg-coral-100 px-3 py-1 text-xs font-semibold text-coral-500">
              <span className="h-2 w-2 rounded-pill bg-coral-500" />
              Not approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-pill bg-peach-100 px-3 py-1 text-xs font-semibold text-peach-700">
              <span className="h-2 w-2 rounded-pill bg-peach-700" />
              Pending approval
            </span>
          )}
        </div>
        {rejected ? (
          <div className="mt-3 flex items-center justify-between gap-3 text-ink-600">
            <span>Questions?</span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="truncate font-semibold text-teal-700"
            >
              {CONTACT_PHONE ?? CONTACT_EMAIL}
            </a>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between text-ink-600">
            <span>Estimated review</span>
            <span className="font-semibold text-foreground">1–2 business days</span>
          </div>
        )}
      </div>

      {showDashboardLink ? (
        <Link
          href="/creator"
          className={cn(buttonVariants(), "mt-6 h-12 w-full rounded-[14px]")}
        >
          Go to dashboard
        </Link>
      ) : (
        <Link
          href="/sign-in"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-6 h-12 w-full rounded-[14px]",
          )}
        >
          Back to sign in
        </Link>
      )}
    </div>
  );
}
