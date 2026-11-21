import type { ReactNode } from "react";
import { Clock, RotateCcw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { ExpandableDescription } from "@/components/expandable-description";
import { CollapsibleCard } from "./collapsible-card";
import { ProductGallery } from "./product-gallery";


// The product design buyers see — shared by the public storefront
// (app/(public)/r/[slug]) and the creator product page
// (app/creator/products/[id]), so creators preview exactly what their
// audience will get. Each surface passes its own `actions` (buyers:
// quantity + Buy Now; creators: the promote button) and an optional
// `badge` shown under the price (creators: their commission).
export type ShowcaseProduct = {
  name: string;
  description: string | null;
  priceBirr: number;
  compareAtBirr: number | null;
  imageUrls: string[];
  trustBadges: string[];
};

export const showcaseProductSelect = {
  name: true,
  description: true,
  priceBirr: true,
  compareAtBirr: true,
  imageUrls: true,
  trustBadges: true,
} as const;

// Icon per badge position (defaults: Free Delivery, Delivered within 2
// hours, Same day return, Nothing to pay before delivery — see
// lib/product-badges.ts). Text is per product, editable by admin.
const BADGE_ICONS: LucideIcon[] = [Truck, Clock, RotateCcw, ShieldCheck];

export function ProductShowcase({
  product,
  actions,
  badge,
}: {
  product: ShowcaseProduct;
  actions: ReactNode;
  badge?: ReactNode;
}) {
  const badges = product.trustBadges
    .map((text, index) => ({ text: text.trim(), Icon: BADGE_ICONS[index] ?? ShieldCheck }))
    .filter((item) => item.text);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
      <ProductGallery images={product.imageUrls} />

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] lg:text-[32px] px-[10px] font-[800] leading-[1.128] text-[#1d1d1f]">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 px-[10px]">
            <span className="flex gap-1 text-[#0cb587]">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </span>
            <span className="text-sm font-[800] text-[#1d1d1f]">
              5.5
            </span>
          </div>  
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[22px] font-bold text-foreground px-[10px]">
              {product.priceBirr.toLocaleString("en-US")} ETB
            </p>
            {product.compareAtBirr &&
            product.compareAtBirr > product.priceBirr ? (
              <p className="text-sm text-ink-400 line-through">
                {product.compareAtBirr.toLocaleString("en-US")} ETB
              </p>
            ) : null}
          </div>
          {badge}
        </div>

        {product.description ? (
          <CollapsibleCard title="Description">
            <ExpandableDescription html={product.description} />
          </CollapsibleCard>
        ) : null}

        {actions}

        {/* Trust badges under Buy Now (Product.trustBadges). */}
        {badges.length > 0 ? (
          <ul
            className={
              badges.length === 4
                ? "grid grid-cols-2 gap-2 text-center sm:grid-cols-4"
                : "grid gap-2 text-center " +
                  (badges.length === 3 ? "grid-cols-3" : badges.length === 2 ? "grid-cols-2" : "grid-cols-1")
            }
          >
            {badges.map(({ text, Icon }, index) => (
              <li
                key={`${index}-${text}`}
                className="flex flex-col items-center justify-center gap-1.5 rounded-[14px] border border-border/70 bg-white/80 px-2 py-3"
              >
                <Icon className="h-5 w-5 text-teal-600" />
                <span className="text-[11px] leading-tight font-medium text-ink-600 sm:text-xs">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
