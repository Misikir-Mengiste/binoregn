"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckoutModal } from "../_components/checkout-modal";

export function ProductPurchasePanel({
  orderHref,
  affiliateLinkSlug,
  productName,
  imageUrl,
  priceBirr,
  colors,
  sizes,
  showAddToCart,
  discountAvailableBirr = null,
}: {
  orderHref: string;
  affiliateLinkSlug: string;
  productName: string;
  imageUrl: string | null;
  priceBirr: number;
  colors: string[];
  sizes: string[];
  showAddToCart: boolean;
  discountAvailableBirr?: number | null;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? "");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

  // Buy Now opens the one-step checkout modal. The buttons stay real links
  // to /r/[slug]/order (fallback page) for no-JS and middle-click/new-tab.
  function openCheckout(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    setCheckoutOpen(true);
  }

  const buyNowHref = useMemo(() => {
    const params = new URLSearchParams({ qty: String(quantity) });
    if (selectedColor) params.set("color", selectedColor);
    if (selectedSize) params.set("size", selectedSize);
    return `${orderHref}?${params.toString()}`;
  }, [orderHref, quantity, selectedColor, selectedSize]);

  // Mobile pop-up Buy Now bar: slides up once the visitor starts scrolling
  // and the inline Buy Now row isn't on screen; slides away again when the
  // footer comes into view, so the two never overlap (no extra footer
  // padding / blank space). Phones only (sm:hidden).
  const buyRowRef = useRef<HTMLDivElement>(null);
  const [rowVisible, setRowVisible] = useState(true);
  const [footerVisible, setFooterVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Checked from positions on scroll/resize (two cheap rect reads)
    // rather than IntersectionObserver, which some browsers pause for
    // backgrounded pages — this always reflects where the page really is.
    const footer = document.querySelector("footer");
    const update = () => {
      const vh = window.innerHeight;
      const row = buyRowRef.current;
      if (row) {
        const r = row.getBoundingClientRect();
        setRowVisible(r.bottom > 0 && r.top < vh);
      }
      setFooterVisible(footer ? footer.getBoundingClientRect().top < vh : false);
      setScrolled(window.scrollY > 40);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const showBar = scrolled && !rowVisible && !footerVisible;
  const total = (priceBirr * quantity).toLocaleString("en-US");

  const stepper = (size: "md" | "sm") => (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-pill border border-border bg-white",
        size === "md" ? "h-12" : "h-11",
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        className="inline-flex h-full w-10 items-center justify-center rounded-l-pill text-ink-600 transition-colors hover:bg-surface-100 disabled:opacity-40"
        disabled={quantity <= 1}
        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        className="min-w-[28px] text-center text-sm font-semibold text-foreground"
        aria-live="polite"
        aria-label={`Quantity ${quantity}`}
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className="inline-flex h-full w-10 items-center justify-center rounded-r-pill text-ink-600 transition-colors hover:bg-surface-100 disabled:opacity-40"
        disabled={quantity >= 99}
        onClick={() => setQuantity((value) => Math.min(99, value + 1))}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {colors.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground">Color</p>
          <div className="flex flex-wrap items-center gap-3">
            {colors.map((color) => {
              const active = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  aria-label={color}
                  aria-pressed={active}
                  className={cn(
                    "h-11 w-11 rounded-[12px] border transition-shadow",
                    active
                      ? "border-teal-600 ring-2 ring-teal-600 ring-offset-2"
                      : "border-border",
                  )}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground">Size</p>
          <div className="flex flex-wrap gap-2.5">
            {sizes.map((size) => {
              const active = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-pill border px-4 py-2 text-sm transition-colors",
                    active
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-border bg-card text-ink-600",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity + Buy Now side by side. */}
      <div className="flex flex-col gap-3">
        <div ref={buyRowRef} className="flex items-center gap-3">
          {stepper("md")}
          <Link
            href={buyNowHref}
            onClick={openCheckout}
            className={cn(
              buttonVariants(),
              "h-12 min-w-0 flex-1 rounded-pill bg-teal-600 text-base text-white shadow-[0_4px_12px_-6px_rgba(12,181,135,0.3)] hover:bg-teal-700",
            )}
          >
            Buy Now
          </Link>
        </div>
        {showAddToCart && (
          <Link
            href={buyNowHref}
            onClick={openCheckout}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 w-full min-w-0 rounded-pill bg-card text-foreground",
            )}
          >
            Add to Cart
          </Link>
        )}
      </div>

      {/* Mobile pop-up Buy Now bar. */}
      <div
        data-buy-bar
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(7,7,7,0.18)] backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none sm:hidden",
          showBar ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        aria-hidden={!showBar}
        inert={!showBar}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-ink-400">Total</p>
            <p className="truncate text-base font-semibold text-foreground">
              {total} ETB
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {stepper("sm")}
            <Link
              href={buyNowHref}
              onClick={openCheckout}
              className={cn(
                buttonVariants(),
                "h-11 rounded-pill bg-teal-600 px-6 text-white hover:bg-teal-700",
              )}
            >
              Buy Now
            </Link>
          </div>
        </div>
      </div>

      {checkoutOpen ? (
        <CheckoutModal
          affiliateLinkSlug={affiliateLinkSlug}
          productName={productName}
          priceBirr={priceBirr}
          imageUrl={imageUrl}
          initialQuantity={quantity}
          color={selectedColor || undefined}
          size={selectedSize || undefined}
          onQuantityChange={setQuantity}
          onClose={closeCheckout}
          discountAvailableBirr={discountAvailableBirr}
        />
      ) : null}
    </div>
  );
}
