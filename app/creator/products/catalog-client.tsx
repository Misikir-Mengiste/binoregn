"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/search-input";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";

type CatalogProduct = {
  id: string;
  name: string;
  priceBirr: number;
  commissionBirr: number;
  imageUrls: string[];
  applicationStatus: string | null;
  affiliateLinkSlug: string | null;
};

// design-system.md "Product card (creator catalog)": 140px
// thumbnail, name 13.5px/600, price 14px/700, commission badge
// (teal-100/teal-700, pill) shown only once approved — before
// approval the CTA is "Apply to earn commission" instead. This
// stays a card grid (not the Sadax admin data-table pattern) since
// it has its own explicit spec in design-system.md and is a
// browse-and-apply surface, not a management table.
export function CatalogClient({
  products: allProducts,
  kpis,
}: {
  products: CatalogProduct[];
  kpis: {
    totalProducts: number;
    approvedLinks: number;
    pendingApplications: number;
  };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(q),
    );
  }, [allProducts, query]);

  async function apply(productId: string) {
    setApplyingId(productId);
    setError(null);
    try {
      const response = await fetch("/api/creator/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? "Could not submit the application",
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products"
        description="Browse the catalog and apply to promote a product."
      />

      <KpiStrip
        items={[
          {
            label: "Available products",
            value: kpis.totalProducts,
            caption: "Products you can apply to",
            accent: "teal",
          },
          {
            label: "Active links",
            value: kpis.approvedLinks,
            caption: "Approved and ready to share",
            accent: "mint",
          },
          {
            label: "Pending applications",
            value: kpis.pendingApplications,
            caption: "Awaiting admin review",
            accent: "orange",
          },
        ]}
      />

      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search products…"
            wide
          />
        </div>
        {error && <p className="px-5 pt-3 text-sm text-destructive">{error}</p>}
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-2 rounded-[10px] border border-border p-3"
            >
              {product.imageUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrls[0]}
                  alt=""
                  className="h-[140px] w-full rounded-[8px] object-cover"
                />
              ) : (
                <div className="h-[140px] w-full rounded-[8px] bg-teal-100" />
              )}
              <p className="text-[13.5px] font-semibold text-foreground">
                {product.name}
              </p>
              <p className="text-[14px] font-bold text-foreground">
                {product.priceBirr} Birr
              </p>

              {product.applicationStatus === "APPROVED" ? (
                <span className="inline-flex w-fit items-center rounded-pill bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700">
                  Earn {product.commissionBirr} Birr commission
                </span>
              ) : product.applicationStatus ? (
                <StatusBadge status={product.applicationStatus} />
              ) : (
                <Button
                  size="sm"
                  disabled={applyingId === product.id}
                  className="w-fit"
                  onClick={() => apply(product.id)}
                >
                  Apply to earn commission
                </Button>
              )}
            </div>
          ))}
        </div>
        {products.length === 0 && (
          <p className="px-5 pb-5 text-sm text-muted-foreground">
            {allProducts.length === 0
              ? "No products available yet."
              : "No products match your search."}
          </p>
        )}
      </div>
    </div>
  );
}
