"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";
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
            value: `${kpis.avgCommissionBirr.toLocaleString()} Birr`,
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Product Name</th>
                <th className="px-5 py-3 font-medium">ID & Create Date</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Applications</th>
                <th className="px-5 py-3 font-medium">Active Links</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.imageUrls[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrls[0]}
                          alt=""
                          className="h-10 w-10 rounded-[8px] border border-border object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-[8px] bg-teal-100" />
                      )}
                      <p className="font-semibold text-foreground">
                        {product.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-foreground">
                      #{product.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-ink-400">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-foreground">
                      {product.priceBirr.toLocaleString()} Birr
                    </p>
                    <p className="text-xs text-ink-400">
                      Commission {product.commissionBirr.toLocaleString()} Birr
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-foreground">
                      {product._count.applications}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {product._count.affiliateLinks > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-mint-100 px-2.5 py-1 text-xs font-medium text-mint-500">
                        <span className="h-1.5 w-1.5 rounded-pill bg-mint-500" />
                        {product._count.affiliateLinks} active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-100 px-2.5 py-1 text-xs font-medium text-ink-400">
                        <span className="h-1.5 w-1.5 rounded-pill bg-ink-400" />
                        No links yet
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-[8px] bg-card"
                        onClick={() => setEditingId(product.id)}
                      >
                        Edit
                      </Button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-card text-ink-400"
                        onClick={() => setEditingId(product.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    {initialProducts.length === 0
                      ? "No products yet — create your first one."
                      : "No products match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
