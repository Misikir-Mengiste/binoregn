"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { ImagePlus, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { Product } from "@/generated/prisma/client";
import {
  DEFAULT_TRUST_BADGES,
  TRUST_BADGE_COUNT,
  TRUST_BADGE_MAX_LENGTH,
} from "@/lib/product-badges";
import { cn } from "@/lib/utils";

type ProductWithExtras = Product & {
  compareAtBirr?: number | null;
  discountEnabled?: boolean;
  discountBirr?: number | null;
  discountCode?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
  soldCount?: number | null;
  sellerName?: string | null;
  sellerVerified?: boolean | null;
  sellerRating?: number | null;
  sellerSoldCount?: number | null;
  shippingDiscountLabel?: string | null;
  shippingPackageLabel?: string | null;
  shippingDeliveryTime?: string | null;
  shippingArrives?: string | null;
};

type ProductFormValues = {
  name: string;
  description: string;
  category: string;
  subCategory: string;
  features: string;
  care: string;
  shipping: string;
  returns: string;
  colors: string;
  sizes: string;
  priceBirr: string;
  compareAtBirr: string;
  discountEnabled: boolean;
  discountBirr: string;
  discountCode: string;
  rating: string;
  ratingCount: string;
  soldCount: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerRating: string;
  sellerSoldCount: string;
  shippingDiscountLabel: string;
  shippingPackageLabel: string;
  shippingDeliveryTime: string;
  shippingArrives: string;
  commissionBirr: string;
  imageUrls: string[];
  stock: string;
  isPublished: boolean;
  maxCreators: string;
  trustBadges: string[];
};

// Legacy delivery values pre-filled when CREATING a product. The product
// page no longer shows a Delivery Options card (2026-11-11 — replaced by
// the trust badges), but the fields are still stored.
const DELIVERY_DEFAULTS = {
  discountLabel: "Disc 15%",
  deliveryTime: "3-4 Working Days",
  returns: "7 Days easy return",
};

function toFormValues(product?: ProductWithExtras): ProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    subCategory: product?.subCategory ?? "",
    features: product?.features?.join("\n") ?? "",
    care: product?.care?.join("\n") ?? "",
    shipping: product?.shipping?.join("\n") ?? "",
    returns: product
      ? product.returns?.join("\n") ?? ""
      : DELIVERY_DEFAULTS.returns,
    colors: product?.colors?.join(", ") ?? "",
    sizes: product?.sizes?.join(", ") ?? "",
    priceBirr: product ? String(product.priceBirr) : "",
    compareAtBirr: product?.compareAtBirr ? String(product.compareAtBirr) : "",
    discountEnabled: Boolean(product?.discountEnabled),
    discountBirr: product?.discountBirr ? String(product.discountBirr) : "",
    discountCode: product?.discountCode ?? "",
    rating: product?.rating ? String(product.rating) : "",
    ratingCount: product?.ratingCount ? String(product.ratingCount) : "",
    soldCount: product?.soldCount ? String(product.soldCount) : "",
    sellerName: product?.sellerName ?? "",
    sellerVerified: Boolean(product?.sellerVerified),
    sellerRating: product?.sellerRating ? String(product.sellerRating) : "",
    sellerSoldCount: product?.sellerSoldCount
      ? String(product.sellerSoldCount)
      : "",
    shippingDiscountLabel: product
      ? product.shippingDiscountLabel ?? ""
      : DELIVERY_DEFAULTS.discountLabel,
    shippingPackageLabel: product?.shippingPackageLabel ?? "",
    shippingDeliveryTime: product
      ? product.shippingDeliveryTime ?? ""
      : DELIVERY_DEFAULTS.deliveryTime,
    shippingArrives: product?.shippingArrives ?? "",
    commissionBirr: product ? String(product.commissionBirr) : "",
    imageUrls: product?.imageUrls ?? [],
    stock: product ? String(product.stock) : "100",
    isPublished: product ? product.isPublished : true,
    maxCreators: product?.maxCreators ? String(product.maxCreators) : "",
    // Always four boxes; new products start with the defaults.
    trustBadges: Array.from(
      { length: TRUST_BADGE_COUNT },
      (_, i) => (product ? product.trustBadges?.[i] ?? "" : DEFAULT_TRUST_BADGES[i]),
    ),
  };
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    body: formData,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message ?? "Image upload failed");
  }
  return body.data.url as string;
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
      <header className="border-b border-border px-5 py-3.5">
        <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
      </header>
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </section>
  );
}

export function ProductForm({
  product,
  onSuccess,
  onCancel,
}: {
  product?: ProductWithExtras;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<ProductFormValues>(
    toFormValues(product),
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // Alternative to uploading a file: add a product image by pasting a URL.
  function addImageUrl() {
    const url = imageUrlInput.trim();
    if (!url) return;
    setValues((v) =>
      v.imageUrls.includes(url)
        ? v
        : { ...v, imageUrls: [...v.imageUrls, url] },
    );
    setImageUrlInput("");
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setValues((v) => ({ ...v, imageUrls: [...v.imageUrls, url] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(url: string) {
    setValues((v) => ({
      ...v,
      imageUrls: v.imageUrls.filter((item) => item !== url),
    }));
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const toList = (value: string) =>
        value
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);
      const toCommaList = (value: string) =>
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

      const body = {
        name: values.name,
        description: values.description || undefined,
        category: values.category || undefined,
        subCategory: values.subCategory || undefined,
        features: toList(values.features),
        care: toList(values.care),
        shipping: toList(values.shipping),
        returns: toList(values.returns),
        colors: toCommaList(values.colors),
        sizes: toCommaList(values.sizes),
        priceBirr: Number(values.priceBirr),
        compareAtBirr: values.compareAtBirr
          ? Number(values.compareAtBirr)
          : undefined,
        // null (not undefined) so clearing a field saves as cleared.
        discountEnabled: values.discountEnabled,
        discountBirr: values.discountBirr ? Number(values.discountBirr) : null,
        discountCode: values.discountCode.trim() || null,
        rating: values.rating ? Number(values.rating) : undefined,
        ratingCount: values.ratingCount ? Number(values.ratingCount) : undefined,
        soldCount: values.soldCount ? Number(values.soldCount) : undefined,
        sellerName: values.sellerName || undefined,
        sellerVerified: values.sellerVerified,
        sellerRating: values.sellerRating
          ? Number(values.sellerRating)
          : undefined,
        sellerSoldCount: values.sellerSoldCount
          ? Number(values.sellerSoldCount)
          : undefined,
        shippingDiscountLabel: values.shippingDiscountLabel || undefined,
        shippingPackageLabel: values.shippingPackageLabel || undefined,
        shippingDeliveryTime: values.shippingDeliveryTime || undefined,
        shippingArrives: values.shippingArrives || undefined,
        commissionBirr: Number(values.commissionBirr),
        imageUrls: values.imageUrls,
        stock: Number(values.stock),
        isPublished: values.isPublished,
        // Blank = unlimited; null (not undefined) so editing can clear it.
        maxCreators: values.maxCreators ? Number(values.maxCreators) : null,
        trustBadges: values.trustBadges.map((badge) => badge.trim()),
      };
      const response = await fetch(
        product ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: product ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error?.message ?? "Could not save the product",
        );
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-20">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <FormCard title="Name and Description">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-ink-600">
              Product Name
            </Label>
            <Input
              id="name"
              required
              className="h-10 rounded-[8px]"
              value={values.name}
              onChange={(e) =>
                setValues((v) => ({ ...v, name: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-ink-600">Product Description</Label>
            <RichTextEditor
              value={values.description}
              onChange={(html) =>
                setValues((v) => ({ ...v, description: html }))
              }
            />
          </div>
        </FormCard>

        <div className="flex flex-col gap-5">
          <FormCard title="Product Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-ink-600">Category</Label>
                <Input
                  className="h-10 rounded-[8px]"
                  placeholder="Accessories"
                  value={values.category}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, category: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-ink-600">Sub-category</Label>
                <Input
                  className="h-10 rounded-[8px]"
                  placeholder="Bags"
                  value={values.subCategory}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, subCategory: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-ink-600">Colors</Label>
              <Input
                className="h-10 rounded-[8px]"
                placeholder="Black, White, Olive"
                value={values.colors}
                onChange={(e) =>
                  setValues((v) => ({ ...v, colors: e.target.value }))
                }
              />
              <p className="text-xs text-ink-400">Separate colors with commas.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-ink-600">Sizes</Label>
              <Input
                className="h-10 rounded-[8px]"
                placeholder="XS, S, M, L, XL"
                value={values.sizes}
                onChange={(e) =>
                  setValues((v) => ({ ...v, sizes: e.target.value }))
                }
              />
              <p className="text-xs text-ink-400">Separate sizes with commas.</p>
            </div>
          </FormCard>

          <FormCard title="Product Pricing">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="priceBirr" className="text-ink-600">
                  Price (ETB)
                </Label>
                <Input
                  id="priceBirr"
                  type="number"
                  min={1}
                  required
                  className="h-10 rounded-[8px]"
                  value={values.priceBirr}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, priceBirr: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="compareAtBirr" className="text-ink-600">
                  Compare at (ETB)
                </Label>
                <Input
                  id="compareAtBirr"
                  type="number"
                  min={1}
                  className="h-10 rounded-[8px]"
                  placeholder="Optional"
                  value={values.compareAtBirr}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, compareAtBirr: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="commissionBirr" className="text-ink-600">
                  Commission (ETB)
                </Label>
                <Input
                  id="commissionBirr"
                  type="number"
                  min={1}
                  required
                  className="h-10 rounded-[8px]"
                  value={values.commissionBirr}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      commissionBirr: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stock" className="text-ink-600">
                  Stock
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min={0}
                  required
                  className="h-10 rounded-[8px]"
                  value={values.stock}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, stock: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maxCreators" className="text-ink-600">
                  Creator limit
                </Label>
                <Input
                  id="maxCreators"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  className="h-10 rounded-[8px]"
                  value={values.maxCreators}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, maxCreators: e.target.value }))
                  }
                />
                <span className="text-xs text-ink-400">
                  Max creators who can promote this product. Leave blank for
                  no limit.
                </span>
              </div>
            </div>
          </FormCard>

          <FormCard title="Creator Discount Code">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs text-ink-400">
                A fixed amount off the order when the buyer types this code
                at checkout. The code is never shown on the product page —
                creators see it on their product page and share it with
                their followers. Creators still earn the full commission.
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={values.discountEnabled}
                aria-label="Discount on"
                onClick={() =>
                  setValues((v) => ({ ...v, discountEnabled: !v.discountEnabled }))
                }
                className={cn(
                  "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
                  values.discountEnabled ? "bg-teal-600" : "bg-ink-400/40",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    values.discountEnabled && "translate-x-5",
                  )}
                />
              </button>
            </div>
            <p
              className={cn(
                "w-fit rounded-pill px-2.5 py-1 text-xs font-semibold",
                values.discountEnabled
                  ? "bg-mint-100 text-mint-500"
                  : "bg-surface-100 text-ink-400",
              )}
            >
              {values.discountEnabled
                ? "On — buyers can use the code"
                : "Off — the code doesn't work and nothing shows"}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="discountBirr" className="text-ink-600">
                  Discount (ETB off)
                </Label>
                <Input
                  id="discountBirr"
                  type="number"
                  min={1}
                  placeholder="e.g. 500"
                  className="h-10 rounded-[8px]"
                  value={values.discountBirr}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, discountBirr: e.target.value }))
                  }
                />
                <span className="text-xs text-ink-400">
                  Taken once per order. Must be less than the price.
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="discountCode" className="text-ink-600">
                  Discount code
                </Label>
                <Input
                  id="discountCode"
                  placeholder="e.g. BINO500"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={20}
                  className="h-10 rounded-[8px] uppercase"
                  value={values.discountCode}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      discountCode: e.target.value.toUpperCase().replace(/\s+/g, ""),
                    }))
                  }
                />
                <span className="text-xs text-ink-400">
                  3–20 letters or numbers. Not case-sensitive for buyers.
                </span>
              </div>
            </div>
          </FormCard>

          <FormCard title="Visibility">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-border"
                checked={values.isPublished}
                onChange={(e) =>
                  setValues((v) => ({ ...v, isPublished: e.target.checked }))
                }
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  Published
                </span>
                <span className="text-xs text-ink-400">
                  Unpublished products (and any at 0 stock, automatically)
                  are hidden from the creator product catalog and from
                  their own public storefront page. Existing affiliate
                  links stay on record but stop resolving.
                </span>
              </span>
            </label>
          </FormCard>

          <FormCard title="Badges under Buy Now">
            <p className="text-xs text-ink-400">
              The four highlights shown under the Buy Now button on the
              product page. Pre-filled with defaults; edit per product, or
              clear one to hide it.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {values.trustBadges.map((badge, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <Label htmlFor={`trustBadge-${index}`} className="text-ink-600">
                    Badge {index + 1}
                  </Label>
                  <Input
                    id={`trustBadge-${index}`}
                    className="h-10 rounded-[8px]"
                    maxLength={TRUST_BADGE_MAX_LENGTH}
                    placeholder={DEFAULT_TRUST_BADGES[index]}
                    value={badge}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        trustBadges: v.trustBadges.map((old, i) =>
                          i === index ? e.target.value : old,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </FormCard>

          <FormCard title="Product Image">
            <div className="flex flex-wrap gap-3">
              <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[8px] border border-dashed border-teal-500 bg-teal-100/40 text-teal-700 transition-colors hover:bg-teal-100">
                <ImagePlus className="h-5 w-5" />
                <span className="px-2 text-center text-[11px] font-medium">
                  {uploading ? "Uploading…" : "Click to Upload"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
              {values.imageUrls.map((url) => (
                <div
                  key={url}
                  className="group relative h-28 w-28 overflow-hidden rounded-[8px] border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1 rounded-[6px] bg-card/95 px-2 py-1 text-[11px] font-medium text-ink-600 opacity-0 shadow-card transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-ink-600">Or add an image by URL</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  className="h-10 rounded-[8px]"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 rounded-[8px] bg-card"
                  onClick={addImageUrl}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-ink-400">
                Paste a public image URL instead of uploading a file.
              </p>
            </div>
          </FormCard>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="fixed right-0 bottom-0 left-[260px] z-20 border-t border-border bg-card/95 px-8 py-4 backdrop-blur">
        <div className="flex flex-wrap justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-[8px] bg-card"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          {product ? (
            <Button
              type="submit"
              variant="outline"
              disabled={submitting || uploading}
              className="h-9 rounded-[8px] bg-card"
            >
              <Save className="h-4 w-4" />
              {submitting ? "Saving…" : "Save Product"}
            </Button>
          ) : (
            <>
              <Button
                type="submit"
                variant="outline"
                disabled={submitting || uploading}
                className="h-9 rounded-[8px] bg-card"
              >
                <Save className="h-4 w-4" />
                {submitting ? "Saving…" : "Save Product"}
              </Button>
              <Button
                type="submit"
                disabled={submitting || uploading}
                className="h-9 rounded-[8px]"
              >
                <Plus className="h-4 w-4" />
                {submitting ? "Saving…" : "Add Product"}
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
