"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckoutForm } from "./checkout-form";

type CheckoutModalProps = Omit<
  React.ComponentProps<typeof CheckoutForm>,
  "onClose"
> & { onClose: () => void };

// One-step checkout as a modal over the product page: a bottom sheet on
// phones, a centred dialog from sm up. Portalled to <body> so it sits
// above the sticky header and the mobile Buy Now bar; page scroll is
// locked while it's open; Esc or a tap on the dimmed backdrop closes it.
// Mount it only while open — closing unmounts it, so a finished or
// abandoned form starts fresh next time.
export function CheckoutModal({ onClose, ...formProps }: CheckoutModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Order form"
    >
      <button
        type="button"
        aria-label="Close order form"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-900/50 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
      />
      <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-hover animate-in slide-in-from-bottom duration-300 ease-out sm:max-h-[88vh] sm:max-w-[460px] sm:rounded-[24px] sm:zoom-in-95 sm:slide-in-from-bottom-4">
        {/* Grab handle (phones) */}
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />
        <div className="overflow-y-auto overscroll-contain px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-5">
          <CheckoutForm {...formProps} onClose={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
