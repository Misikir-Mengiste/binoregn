import type { ReactNode } from "react";
import { Mail, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { Logo } from "@/components/logo";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/site";

// Buyer-facing pages (product, checkout, order tracking). Brand header +
// footer that keeps contact details and the pay-on-delivery promise
// visible on every one of them (progress-tracker 2026-11-11). The logo
// isn't a link: buyers arrive from a creator's link and shouldn't be
// sent off to the creator-marketing homepage. Width matches the page
// content (max-w-5xl) so nothing stretches on wide screens.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Logo className="h-5 sm:h-6" />
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-mint-100 px-3 py-1 text-xs font-medium whitespace-nowrap text-mint-500">
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden min-[360px]:inline">Mobile Transfer on Delivery</span>
            <span className="min-[360px]:hidden">Pay on delivery</span>
          </span>
        </div>
      </header>
      {children}
      {/* relative: keeps the footer above the product page's fixed glass
          backdrop (components/product/glass-backdrop.tsx). */}
      <footer className="relative border-t border-border/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-sm text-ink-600 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
            <span className="inline-flex items-start gap-2">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <span className="flex flex-col">
                <span className="font-medium text-foreground">Mobile Transfer on Delivery</span>
                <span className="text-xs text-ink-600">
                  Pay via mobile transfer when your order arrives.
                </span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600" />
              Nothing to pay before delivery
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="font-medium text-foreground">Questions?</span>
            {CONTACT_PHONE ? (
              <a
                href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1.5 font-medium text-teal-700"
              >
                <Phone className="h-4 w-4" />
                {CONTACT_PHONE}
              </a>
            ) : null}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex min-w-0 items-center gap-1.5 break-all font-medium text-teal-700"
            >
              <Mail className="h-4 w-4 shrink-0" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
