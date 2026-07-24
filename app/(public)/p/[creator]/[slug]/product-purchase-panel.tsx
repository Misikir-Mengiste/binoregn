"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProductPurchasePanel({
  orderHref,
  colors,
  sizes,
  showAddToCart,
}: {
  orderHref: string;
  colors: string[];
  sizes: string[];
  showAddToCart: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? "");

  const buyNowHref = useMemo(() => {
    const params = new URLSearchParams({ qty: String(quantity) });
    if (selectedColor) params.set("color", selectedColor);
    if (selectedSize) params.set("size", selectedSize);
    return `${orderHref}?${params.toString()}`;
  }, [orderHref, quantity, selectedColor, selectedSize]);

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

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease quantity"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-card text-ink-600 transition-colors hover:bg-surface-100"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[32px] text-center text-sm font-semibold text-foreground">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-card text-ink-600 transition-colors hover:bg-surface-100"
          onClick={() => setQuantity((value) => Math.min(99, value + 1))}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          showAddToCart && "sm:grid-cols-2",
        )}
      >
        {showAddToCart && (
          <Link
            href={buyNowHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 w-full min-w-0 rounded-pill bg-card text-foreground",
            )}
          >
            Add to Cart
          </Link>
        )}
        <Link
          href={buyNowHref}
          className={cn(
            buttonVariants(),
            "h-12 w-full min-w-0 rounded-pill bg-teal-600 text-white hover:bg-teal-700",
          )}
        >
          Buy Now
        </Link>
      </div>
    </div>
  );
}
