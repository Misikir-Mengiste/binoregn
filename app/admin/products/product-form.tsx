"use client";

import { useRef, useState, type ChangeEvent, type SubmitEvent } from "react";
import { ImagePlus, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/generated/prisma/client";

type ProductWithExtras = Product & {
  compareAtBirr?: number | null;
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
};

// Delivery Options values pre-filled when CREATING a product (admin can
// edit per product). They feed the storefront's Delivery Options card so
// new products ship with sensible, editable defaults instead of blanks.
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
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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

  // Wrap the current textarea selection with markdown markers (or insert a
  // placeholder if nothing is selected), then restore focus/selection.
  function wrapSelection(before: string, after: string, placeholder: string) {
    const el = descriptionRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = values.description;
    const selected = text.slice(start, end) || placeholder;
    const next =
      text.slice(0, start) + before + selected + after + text.slice(end);
    setValues((v) => ({ ...v, description: next }));
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length;
      el.setSelectionRange(cursor, cursor + selected.length);
    });
  }

  // Prefix every line touched by the selection with "- " for bullet lists.
  function prefixSelectedLines(prefix: string) {
    const el = descriptionRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = values.description;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const block = text.slice(lineStart, end);
    const prefixed = block
      .split("\n")
      .map((line) => prefix + line)
      .join("\n");
    const next = text.slice(0, lineStart) + prefixed + text.slice(end);
    setValues((v) => ({ ...v, description: next }));
    requestAnimationFrame(() => el.focus());
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
            <Label htmlFor="description" className="text-ink-600">
              Product Description
            </Label>
            <textarea
              id="description"
              ref={descriptionRef}
              rows={8}
              className="w-full rounded-[8px] border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
            />
            <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-border bg-surface-100 px-2.5 py-1 text-[11px] text-ink-400">
              <button
                type="button"
                onClick={() => wrapSelection("**", "**", "bold text")}
                className="rounded-[6px] border border-border bg-card px-1.5 py-0.5 font-semibold text-ink-600 transition-colors hover:bg-surface-100"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => wrapSelection("*", "*", "italic text")}
                className="rounded-[6px] border border-border bg-card px-1.5 py-0.5 font-medium text-ink-600 italic transition-colors hover:bg-surface-100"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => wrapSelection("__", "__", "underlined text")}
                className="rounded-[6px] border border-border bg-card px-1.5 py-0.5 font-medium text-ink-600 underline transition-colors hover:bg-surface-100"
              >
                U
              </button>
              <button
                type="button"
                onClick={() => wrapSelection("[", "](https://)", "link text")}
                className="rounded-[6px] border border-border bg-card px-2 py-0.5 text-ink-600 transition-colors hover:bg-surface-100"
              >
                Link
              </button>
              <button
                type="button"
                onClick={() => prefixSelectedLines("- ")}
                className="rounded-[6px] border border-border bg-card px-2 py-0.5 text-ink-600 transition-colors hover:bg-surface-100"
              >
                List
              </button>
              <span className="ml-auto text-ink-400">
                Bold, italic, underline, links &amp; lists
              </span>
            </div>
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
                  Price (Birr)
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
                  Compare at (Birr)
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
                  Commission (Birr)
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
            </div>
          </FormCard>

          <FormCard title="Delivery Options">
            <p className="text-xs text-ink-400">
              Shown in the Delivery Options card on the product page.
              Pre-filled with defaults — edit per product if needed.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-ink-600">Discount</Label>
                <Input
                  className="h-10 rounded-[8px]"
                  placeholder="Disc 15%"
                  value={values.shippingDiscountLabel}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      shippingDiscountLabel: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-ink-600">Payment</Label>
                <Input
                  className="h-10 rounded-[8px] bg-surface-100 text-ink-400"
                  value="Cash on Delivery Available"
                  readOnly
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-ink-600">Delivery time</Label>
                <Input
                  className="h-10 rounded-[8px]"
                  placeholder="3-4 Working Days"
                  value={values.shippingDeliveryTime}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      shippingDeliveryTime: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-ink-600">Return &amp; Warranty</Label>
                <Input
                  className="h-10 rounded-[8px]"
                  placeholder="7 Days easy return"
                  value={values.returns}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, returns: e.target.value }))
                  }
                />
              </div>
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
