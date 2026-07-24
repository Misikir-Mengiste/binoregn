"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { CreatorStatCard } from "@/components/creator-stat-card";

type LinkRow = {
  slug: string;
  viewCount: number;
  orderCount: number;
  product: {
    name: string;
    commissionBirr: number;
    imageUrls: string[];
  };
};

const PAGE_SIZE = 8;

export function LinksListClient({
  links: allLinks,
  creatorSlug,
  totals,
}: {
  links: LinkRow[];
  creatorSlug: string;
  totals: { links: number; views: number; orders: number };
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allLinks;
    return allLinks.filter((link) =>
      link.product.name.toLowerCase().includes(q),
    );
  }, [allLinks, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const links = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CreatorStatCard
          value={totals.links.toLocaleString()}
          label="Active links"
          bg="bg-teal-100"
        />
        <CreatorStatCard
          value={totals.views.toLocaleString()}
          label="Total link views"
          bg="bg-blue-100"
        />
        <CreatorStatCard
          value={totals.orders.toLocaleString()}
          label="Total orders"
          bg="bg-mint-100"
        />
      </div>

      <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-foreground">Your links</h2>
          <div className="sm:w-64">
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Search links…"
              wide
            />
          </div>
        </div>

        {links.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-surface-100 text-xs text-ink-400">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Views</th>
                  <th className="px-5 py-3 font-medium">Orders</th>
                  <th className="px-5 py-3 text-right font-medium">Link</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.slug} className="border-t border-border">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border border-border bg-surface-100">
                          {link.product.imageUrls[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={link.product.imageUrls[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-teal-100" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {link.product.name}
                          </p>
                          <p className="text-xs text-ink-400">
                            Earn {link.product.commissionBirr.toLocaleString()}{" "}
                            ETB per completed order
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {link.viewCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {link.orderCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <CopyButton path={`/p/${creatorSlug}/${link.slug}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            {allLinks.length === 0
              ? "No approved links yet — apply to a product on the Products page and wait for admin approval."
              : "No links match your search."}
          </p>
        )}

        {filtered.length > 0 && (
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
