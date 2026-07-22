"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
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

function toFormValues(product?: ProductWithExtras): ProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    subCategory: product?.subCategory ?? "",
    features: product?.features?.join("\n") ?? "",
    care: product?.care?.join("\n") ?? "",
    shipping: product?.shipping?.join("\n") ?? "",
    returns: product?.returns?.join("\n") ?? "",
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
    shippingDiscountLabel: product?.shippingDiscountLabel ?? "",
    shippingPackageLabel: product?.shippingPackageLabel ?? "",
    shippingDeliveryTime: product?.shippingDeliveryTime ?? "",
    shippingArrives: product?.shippingArrives ?? "",
    commissionBirr: product ? String(product.commissionBirr) : "",
    imageUrls: product?.imageUrls ?? [],
  };
}

async function uploadImage(file: File): Promise<string> {
  const sigResponse = await fetch("/api/admin/uploads/signature", {
    method: "POST",
  });
  if (!sigResponse.ok) {
    throw new Error("Could not get an upload signature");
  }
  const { data: sig } = await sigResponse.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: formData },
  );
  const uploaded = await uploadResponse.json();
  if (!uploadResponse.ok) {
    throw new Error(uploaded?.error?.message ?? "Image upload failed");
  }
  return uploaded.secure_url as string;
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
              rows={8}
              className="w-full rounded-[8px] border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
            />
            <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-border bg-surface-100 px-2.5 py-1 text-[11px] text-ink-400">
              <span className="rounded-[6px] border border-border bg-card px-1.5 py-0.5 font-semibold text-ink-600">
                B
              </span>
              <span className="rounded-[6px] border border-border bg-card px-1.5 py-0.5 font-medium italic text-ink-600">
                I
              </span>
              <span className="rounded-[6px] border border-border bg-card px-1.5 py-0.5 font-medium text-ink-600 underline">
                U
              </span>
              <span className="rounded-[6px] border border-border bg-card px-2 py-0.5 text-ink-600">
                Link
              </span>
              <span className="rounded-[6px] border border-border bg-card px-2 py-0.5 text-ink-600">
                List
              </span>
              <span className="ml-auto text-ink-400">
                Formatting toolbar (preview)
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rating" className="text-ink-600">
                  Rating (0-5)
                </Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  className="h-10 rounded-[8px]"
                  placeholder="Optional"
                  value={values.rating}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, rating: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ratingCount" className="text-ink-600">
                  Rating count
                </Label>
                <Input
                  id="ratingCount"
                  type="number"
                  min={0}
                  className="h-10 rounded-[8px]"
                  placeholder="Optional"
                  value={values.ratingCount}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, ratingCount: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="soldCount" className="text-ink-600">
                  Sold count
                </Label>
                <Input
                  id="soldCount"
                  type="number"
                  min={0}
                  className="h-10 rounded-[8px]"
                  placeholder="Optional"
                  value={values.soldCount}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, soldCount: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sellerName" className="text-ink-600">
                  Seller display name
                </Label>
                <Input
                  id="sellerName"
                  className="h-10 rounded-[8px]"
                  placeholder="Binoregn"
                  value={values.sellerName}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, sellerName: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sellerRating" className="text-ink-600">
                  Seller rating
                </Label>
                <Input
                  id="sellerRating"
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  className="h-10 rounded-[8px]"
                  placeholder="4.9"
                  value={values.sellerRating}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, sellerRating: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sellerSoldCount" className="text-ink-600">
                  Seller sold count
                </Label>
                <Input
                  id="sellerSoldCount"
                  type="number"
                  min={0}
                  className="h-10 rounded-[8px]"
                  placeholder="1000"
                  value={values.sellerSoldCount}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      sellerSoldCount: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="sellerVerified"
                  type="checkbox"
                  checked={values.sellerVerified}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      sellerVerified: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="sellerVerified" className="text-ink-600">
                  Verified seller badge
                </Label>
              </div>
            </div>
          </FormCard>

          <FormCard title="Shipping highlights">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-ink-600">Discount label</Label>
                <Input
                  className="h-10 rounded-[8px]"
                  placeholder="50% off"
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
                <Label className="text-ink-600">Package label</Label>
                <Input
                  className="h-10 rounded-[8px]"
                  placeholder="Regular"
                  value={values.shippingPackageLabel}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      shippingPackageLabel: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-ink-600">Delivery time</Label>
                <Input
                  className="h-10 rounded-[8px]"
                  placeholder="3-4 working days"
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
                <Label className="text-ink-600">Arrives</Label>
                <Input
                  className="h-10 rounded-[8px]"
                  placeholder="8-12 Oct 2026"
                  value={values.shippingArrives}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      shippingArrives: e.target.value,
                    }))
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
          </FormCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <FormCard title="Features">
          <div className="flex flex-col gap-1.5">
            <Label className="text-ink-600">Feature list</Label>
            <textarea
              rows={6}
              className="w-full rounded-[8px] border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="- Multiple strap configurations"
              value={values.features}
              onChange={(e) =>
                setValues((v) => ({ ...v, features: e.target.value }))
              }
            />
            <p className="text-xs text-ink-400">One feature per line.</p>
          </div>
        </FormCard>
        <FormCard title="Care">
          <div className="flex flex-col gap-1.5">
            <Label className="text-ink-600">Care instructions</Label>
            <textarea
              rows={6}
              className="w-full rounded-[8px] border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="- Spot clean as needed"
              value={values.care}
              onChange={(e) =>
                setValues((v) => ({ ...v, care: e.target.value }))
              }
            />
            <p className="text-xs text-ink-400">One instruction per line.</p>
          </div>
        </FormCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <FormCard title="Shipping">
          <div className="flex flex-col gap-1.5">
            <Label className="text-ink-600">Shipping details</Label>
            <textarea
              rows={6}
              className="w-full rounded-[8px] border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="- Free shipping on orders over 500 Birr"
              value={values.shipping}
              onChange={(e) =>
                setValues((v) => ({ ...v, shipping: e.target.value }))
              }
            />
            <p className="text-xs text-ink-400">One detail per line.</p>
          </div>
        </FormCard>
        <FormCard title="Returns">
          <div className="flex flex-col gap-1.5">
            <Label className="text-ink-600">Returns policy</Label>
            <textarea
              rows={6}
              className="w-full rounded-[8px] border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="- Easy return requests"
              value={values.returns}
              onChange={(e) =>
                setValues((v) => ({ ...v, returns: e.target.value }))
              }
            />
            <p className="text-xs text-ink-400">One policy per line.</p>
          </div>
        </FormCard>
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
