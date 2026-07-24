"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import { TableToolbar } from "@/components/table-toolbar";
import { Pagination } from "@/components/pagination";
import type { Product } from "@/generated/prisma/client";
import { ProductForm } from "./product-form";

type ProductRow = Product & {
  _count: { applications: number; affiliateLinks: number };
};

const PAGE_SIZE = 8;

export function ProductsClient({
  initialProducts,
  kpis,
}: {
  initialProducts: ProductRow[];
  kpis: {
    totalProducts: number;
    activeLinks: number;
    avgCommissionBirr: number;
    pendingApplications: number;
  };
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [linkFilter, setLinkFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialProducts.filter((product) => {
      if (linkFilter === "ACTIVE" && product._count.affiliateLinks === 0) {
        return false;
      }
      if (linkFilter === "NONE" && product._count.affiliateLinks > 0) {
        return false;
      }
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.id.toLowerCase().includes(q)
      );
    });
  }, [initialProducts, query, linkFilter]);

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pageItems = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSuccess() {
    setCreating(false);
    setEditingId(null);
    router.refresh();
  }

  const editingProduct = editingId
    ? initialProducts.find((p) => p.id === editingId)
    : undefined;
  const previewProduct = previewId
    ? initialProducts.find((p) => p.id === previewId)
    : undefined;

  if (creating) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Add New Product"
          description="Add a new product to your store"
          breadcrumbs={[
            { label: "Products", href: "/admin/products" },
            { label: "Add New Product" },
          ]}
        />
        <ProductForm
          onSuccess={handleSuccess}
          onCancel={() => setCreating(false)}
        />
      </div>
    );
  }

  if (editingProduct) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Edit Product"
          description="Update product details and commission."
          breadcrumbs={[
            { label: "Products", href: "/admin/products" },
            { label: "Edit Product" },
          ]}
        />
        <ProductForm
          product={editingProduct}
          onSuccess={handleSuccess}
          onCancel={() => setEditingId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products List"
        description="Here you can find all of your products."
        breadcrumbs={[{ label: "Products" }]}
        showMoreActions
        actions={
          <Button
            onClick={() => setCreating(true)}
            className="h-9 rounded-[8px]"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <KpiStrip
        items={[
          {
            label: "Total Products",
            value: kpis.totalProducts.toLocaleString(),
            caption: "Products in your catalog",
            accent: "teal",
          },
          {
            label: "Active Links",
            value: kpis.activeLinks.toLocaleString(),
            caption: "Approved affiliate links across all products",
            accent: "mint",
          },
          {
            label: "Avg. Commission",
            value: `${kpis.avgCommissionBirr.toLocaleString()} ETB`,
            caption: "Average commission per product",
            accent: "orange",
          },
          {
            label: "Pending Applications",
            value: kpis.pendingApplications.toLocaleString(),
            caption: "Awaiting your review",
            accent: "coral",
          },
        ]}
      />

      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <TableToolbar
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          searchPlaceholder="Search by name, Product ID…"
          status={linkFilter}
          onStatusChange={(value) => {
            setLinkFilter(value);
            setPage(1);
          }}
          statusOptions={[
            { value: "ALL", label: "All Products" },
            { value: "ACTIVE", label: "Has active links" },
            { value: "NONE", label: "No links yet" },
          ]}
          showDateRange={false}
          showMoreFilter={false}
        />

        <div className="p-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {pageItems.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer"
                onClick={() => setPreviewId(product.id)}
              >
                <div className="overflow-hidden rounded-lg bg-surface-100">
                  {product.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrls[0]}
                      alt=""
                      className="aspect-square w-full object-cover transition-opacity group-hover:opacity-75"
                    />
                  ) : (
                    <div className="aspect-square w-full bg-teal-100" />
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="text-xs text-ink-400">{product.category}</p>
                    )}
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {product.priceBirr.toLocaleString()} ETB
                    </p>
                    <p className="text-xs text-ink-400">
                      Commission {product.commissionBirr.toLocaleString()} ETB
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-ink-400">
                    <span>{product._count.applications} apps</span>
                    <span>{product._count.affiliateLinks} links</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-[8px] bg-card"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingId(product.id);
                    }}
                  >
                    Edit
                  </Button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-card text-ink-400"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingId(product.id);
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pageItems.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {initialProducts.length === 0
                ? "No products yet — create your first one."
                : "No products match your search."}
            </div>
          )}
        </div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>

      {previewProduct && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setPreviewId(null)}
            aria-label="Close preview"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto border-l border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Product preview
                </p>
                <p className="text-xs text-ink-400">Storefront view</p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-border text-ink-600"
                onClick={() => setPreviewId(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-[12px] border border-border">
                  {previewProduct.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewProduct.imageUrls[0]}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gradient-to-br from-teal-100 to-blue-100" />
                  )}
                </div>
                {previewProduct.imageUrls.length > 1 && (
                  <div className="flex gap-2">
                    {previewProduct.imageUrls.map((url) => (
                      <div
                        key={url}
                        className="h-14 w-14 overflow-hidden rounded-[8px] border border-border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <p className="text-lg font-bold text-foreground">
                    {previewProduct.name}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {previewProduct.priceBirr} ETB
                  </p>
                  {previewProduct.description && (
                    <p className="text-sm text-ink-600">
                      {previewProduct.description}
                    </p>
                  )}
                </div>

                {previewProduct.colors.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-ink-600">Colors</p>
                    <div className="flex items-center gap-2">
                      {previewProduct.colors.map((color) => (
                        <span
                          key={color}
                          className="h-4 w-4 rounded-full border border-border"
                          title={color}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {previewProduct.sizes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-ink-600">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {previewProduct.sizes.map((size) => (
                        <span
                          key={size}
                          className="rounded-[10px] border border-border px-2.5 py-1 text-xs font-semibold text-ink-600"
                        >
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {previewProduct.features.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-teal-700">Features</p>
                    <ul className="mt-2 list-disc pl-4 text-sm text-ink-600">
                      {previewProduct.features.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {previewProduct.care.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-teal-700">Care</p>
                    <ul className="mt-2 list-disc pl-4 text-sm text-ink-600">
                      {previewProduct.care.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {previewProduct.shipping.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-teal-700">Shipping</p>
                    <ul className="mt-2 list-disc pl-4 text-sm text-ink-600">
                      {previewProduct.shipping.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {previewProduct.returns.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-teal-700">Returns</p>
                    <ul className="mt-2 list-disc pl-4 text-sm text-ink-600">
                      {previewProduct.returns.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
