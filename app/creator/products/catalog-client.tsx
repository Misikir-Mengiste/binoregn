"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search-input";
import { cn } from "@/lib/utils";
import type { PromoteState } from "@/lib/promotion";

type CatalogProduct = {
  id: string;
  name: string;
  category: string | null;
  priceBirr: number;
  commissionBirr: number;
  imageUrls: string[];
  sizes: string[];
  promoteKind: PromoteState["kind"];
  spotsLeft: number | null;
};

// Promote state shown as a banner/label on each product card — the same
// states the product page button walks through (lib/promotion.ts).
// REQUEST shows no banner; tapping the card opens the product page.
const PROMOTION_STATUS: Partial<
  Record<
    PromoteState["kind"],
    { label: string; icon: string; bar?: string; text?: string }
  >
> = {
  APPROVED: { label: "Promoting", icon: "", text: "text-teal-600" },
  PENDING: { label: "Waiting for Approval", icon: "", text: "text-orange-500" },
  REJECTED: { label: "Not Approved", icon: "✕", bar: "bg-red-500" },
  FULL: { label: "Full", icon: "", bar: "bg-ink-400" },
};

// Fixed ETB price buckets — only those with matching products are shown,
// each with a real live count.
const PRICE_BUCKETS = [
  { key: "u500", label: "Below 500 ETB", min: 0, max: 499 },
  { key: "500-1000", label: "500 – 1,000 ETB", min: 500, max: 1000 },
  { key: "1000-2000", label: "1,000 – 2,000 ETB", min: 1000, max: 2000 },
  { key: "2000-3000", label: "2,000 – 3,000 ETB", min: 2000, max: 3000 },
  { key: "o3000", label: "Over 3,000 ETB", min: 3000, max: Infinity },
];

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[12px] border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold text-foreground"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  const [lo, hi] = value;
  const span = Math.max(max - min, 1);
  const pctLo = ((lo - min) / span) * 100;
  const pctHi = ((hi - min) / span) * 100;
  const thumb =
    "pointer-events-none absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:shadow " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-teal-600";

  return (
    <div className="relative h-8">
      <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-surface-100" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-teal-600"
        style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={10}
        value={lo}
        onChange={(event) =>
          onChange([Math.min(Number(event.target.value), hi), hi])
        }
        className={thumb}
        aria-label="Minimum price"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={10}
        value={hi}
        onChange={(event) =>
          onChange([lo, Math.max(Number(event.target.value), lo)])
        }
        className={thumb}
        aria-label="Maximum price"
      />
    </div>
  );
}

export function CatalogClient({
  products: allProducts,
  kpis,
}: {
  products: CatalogProduct[];
  kpis: { totalProducts: number };
}) {
  const router = useRouter();

  // Filter option data, all derived from real products.
  const categories = useMemo(() => {
    const set = new Set(
      allProducts.map((p) => p.category).filter(Boolean) as string[],
    );
    return Array.from(set).sort();
  }, [allProducts]);

  const sizes = useMemo(() => {
    const set = new Set(allProducts.flatMap((p) => p.sizes));
    return Array.from(set);
  }, [allProducts]);

  const [priceMin, priceMax] = useMemo(() => {
    if (allProducts.length === 0) return [0, 0];
    const prices = allProducts.map((p) => p.priceBirr);
    return [Math.min(...prices), Math.max(...prices)];
  }, [allProducts]);

  const buckets = useMemo(
    () =>
      PRICE_BUCKETS.map((bucket) => ({
        ...bucket,
        count: allProducts.filter(
          (p) => p.priceBirr >= bucket.min && p.priceBirr <= bucket.max,
        ).length,
      })).filter((bucket) => bucket.count > 0),
    [allProducts],
  );

  // Filter state.
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [priceBucket, setPriceBucket] = useState<string>("ALL");
  const [range, setRange] = useState<[number, number]>([priceMin, priceMax]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function toggleSetValue(
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function selectBucket(bucket: (typeof buckets)[number] | null) {
    if (!bucket) {
      setPriceBucket("ALL");
      setRange([priceMin, priceMax]);
      return;
    }
    setPriceBucket(bucket.key);
    setRange([
      Math.max(bucket.min, priceMin),
      bucket.max === Infinity ? priceMax : Math.min(bucket.max, priceMax),
    ]);
  }

  function setCustomRange(next: [number, number]) {
    setPriceBucket("CUSTOM");
    setRange(next);
  }

  function clearFilters() {
    setSelectedCategories(new Set());
    setSelectedSizes(new Set());
    setPriceBucket("ALL");
    setRange([priceMin, priceMax]);
    setQuery("");
  }

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProducts.filter((product) => {
      if (
        selectedCategories.size > 0 &&
        (!product.category || !selectedCategories.has(product.category))
      ) {
        return false;
      }
      if (
        selectedSizes.size > 0 &&
        !product.sizes.some((size) => selectedSizes.has(size))
      ) {
        return false;
      }
      if (product.priceBirr < range[0] || product.priceBirr > range[1]) {
        return false;
      }
      if (q && !product.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allProducts, query, selectedCategories, selectedSizes, range]);

  const activeFilterCount =
    selectedCategories.size +
    selectedSizes.size +
    (priceBucket !== "ALL" ? 1 : 0);

  const sidebar = (
    <aside
      className={cn(
        "flex-col gap-4",
        filtersOpen ? "flex" : "hidden",
        "lg:flex",
      )}
    >
      <FilterSection title="Categories">
        {categories.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {categories.map((category) => (
              <label
                key={category}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-600"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.has(category)}
                  onChange={() =>
                    toggleSetValue(setSelectedCategories, category)
                  }
                  className="h-4 w-4 rounded accent-teal-600"
                />
                {category}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-400">No categories yet.</p>
        )}
      </FilterSection>

      <FilterSection title="Product Price">
        <div className="flex flex-col gap-2.5">
          <label className="flex cursor-pointer items-center justify-between gap-2.5 text-sm text-ink-600">
            <span className="flex items-center gap-2.5">
              <input
                type="radio"
                name="price-bucket"
                checked={priceBucket === "ALL"}
                onChange={() => selectBucket(null)}
                className="h-4 w-4 accent-teal-600"
              />
              All prices
            </span>
            <span className="text-xs text-ink-400">
              ({allProducts.length})
            </span>
          </label>
          {buckets.map((bucket) => (
            <label
              key={bucket.key}
              className="flex cursor-pointer items-center justify-between gap-2.5 text-sm text-ink-600"
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="price-bucket"
                  checked={priceBucket === bucket.key}
                  onChange={() => selectBucket(bucket)}
                  className="h-4 w-4 accent-teal-600"
                />
                {bucket.label}
              </span>
              <span className="text-xs text-ink-400">({bucket.count})</span>
            </label>
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold text-ink-600">
            Custom price range
          </p>
          <PriceRangeSlider
            min={priceMin}
            max={priceMax}
            value={range}
            onChange={setCustomRange}
          />
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              value={range[0]}
              min={priceMin}
              max={range[1]}
              onChange={(event) =>
                setCustomRange([Number(event.target.value), range[1]])
              }
              className="h-9 w-full rounded-[8px] border border-border bg-card px-2.5 text-sm text-foreground"
              aria-label="Minimum price"
            />
            <span className="text-ink-400">—</span>
            <input
              type="number"
              value={range[1]}
              min={range[0]}
              max={priceMax}
              onChange={(event) =>
                setCustomRange([range[0], Number(event.target.value)])
              }
              className="h-9 w-full rounded-[8px] border border-border bg-card px-2.5 text-sm text-foreground"
              aria-label="Maximum price"
            />
          </div>
        </div>
      </FilterSection>

      {sizes.length > 0 && (
        <FilterSection title="Size & Fit">
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const active = selectedSizes.has(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSetValue(setSelectedSizes, size)}
                  className={cn(
                    "min-w-9 rounded-[8px] border px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "border-teal-600 bg-teal-100 text-teal-700"
                      : "border-border bg-card text-ink-600 hover:bg-surface-100",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      <Button
        type="button"
        variant="outline"
        className="bg-card"
        onClick={clearFilters}
        disabled={activeFilterCount === 0 && !query}
      >
        Clear all filters
      </Button>
    </aside>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {sidebar}

        <div className="flex flex-col gap-5">
          {/* Header: breadcrumb + count + search */}
          <div className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-4 shadow-card lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs text-ink-400">
                Products{" "}
                <span className="text-ink-600">
                  ›{" "}
                  {selectedCategories.size === 1
                    ? Array.from(selectedCategories)[0]
                    : "All products"}
                </span>
              </p>
              <p className="text-sm font-semibold text-foreground">
                Showing {products.length.toLocaleString("en-US")} of{" "}
                {kpis.totalProducts.toLocaleString("en-US")} products
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="min-w-[200px] flex-1">
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search products…"
                  wide
                />
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((value) => !value)}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-border bg-card px-3 text-sm font-medium text-ink-600 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-pill bg-teal-600 px-1 text-[11px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {/* Product grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const promo = PROMOTION_STATUS[product.promoteKind] ?? null;
                return (
                  <div
                    key={product.id}
                    role="link"
                    tabIndex={0}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-border bg-card p-3 shadow-card transition-shadow hover:shadow-md"
                    onClick={() => router.push(`/creator/products/${product.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        router.push(`/creator/products/${product.id}`);
                      }
                    }}
                  >
                    {promo && promo.bar && (
                      <div
                        className={cn(
                          "-mx-3 -mt-3 mb-3 flex items-center justify-center gap-1.5 rounded-t-[14px] py-2.5 text-sm font-semibold text-white",
                          promo.bar,
                        )}
                      >
                        {promo.icon && <span aria-hidden>{promo.icon}</span>}
                        {promo.label}
                      </div>
                    )}
                    {promo && promo.text && (
                      <div
                        className={cn(
                          "mb-2 text-center text-sm font-semibold",
                          promo.text,
                        )}
                      >
                        {promo.label}
                      </div>
                    )}
                    <div className="overflow-hidden rounded-[10px] bg-surface-100">
                      {product.imageUrls[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrls[0]}
                          alt=""
                          className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="aspect-square w-full bg-teal-100" />
                      )}
                    </div>
                    <h3 className="mt-3 text-xs font-semibold text-foreground sm:text-sm">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <p className="text-sm font-bold text-foreground sm:text-base">
                        ETB {product.priceBirr.toLocaleString("en-US")}
                      </p>
                      <p className="text-xs font-semibold text-teal-600 sm:text-sm">
                        +ETB {product.commissionBirr.toLocaleString("en-US")}
                      </p>
                    </div>
                    {product.promoteKind === "REQUEST" &&
                    product.spotsLeft !== null ? (
                      <p className="mt-2 text-xs text-ink-400">
                        {product.spotsLeft} spots left
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[14px] border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-card">
              {allProducts.length === 0
                ? "No products available yet."
                : "No products match your filters."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
