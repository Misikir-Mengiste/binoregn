// Creator discount codes (progress-tracker 2026-11-21). Per product: an
// on/off switch, a fixed Birr amount and a code. Buyers type the code at
// checkout (they get it from the creator — it's never shown on the
// product page). The discount is taken once per order, and the creator's
// commission is unaffected. Orders snapshot discountBirr/discountCode.

export const DISCOUNT_CODE_PATTERN = /^[A-Z0-9_-]{3,20}$/;

/** Codes are case-insensitive: stored and compared uppercase. */
export function normalizeDiscountCode(value: string) {
  return value.trim().toUpperCase();
}

type DiscountProduct = {
  priceBirr: number;
  discountEnabled: boolean;
  discountBirr: number | null;
  discountCode: string | null;
};

/** The Birr amount off when the product's discount is live, else null. */
export function activeDiscountBirr(product: DiscountProduct) {
  if (!product.discountEnabled || !product.discountCode) return null;
  const amount = product.discountBirr ?? 0;
  // Must leave something to pay — never a free or negative order.
  if (amount <= 0 || amount >= product.priceBirr) return null;
  return amount;
}

/**
 * The discount a typed code earns on this product: the amount when the
 * discount is on and the code matches (any case), otherwise null.
 */
export function discountForCode(product: DiscountProduct, code: string) {
  const amount = activeDiscountBirr(product);
  if (amount === null) return null;
  return normalizeDiscountCode(code) === product.discountCode ? amount : null;
}

/** What the buyer pays for an order. */
export function orderTotalBirr(order: {
  priceBirr: number;
  quantity: number;
  discountBirr?: number | null;
}) {
  return Math.max(0, order.priceBirr * order.quantity - (order.discountBirr ?? 0));
}

/**
 * Why a product's discount settings can't be saved, or null. Checked by
 * the admin product routes on the final (merged) values. Switching it on
 * needs a code and an amount below the price; when off, the saved code
 * and amount are kept so it can be switched back on later.
 */
export function discountSettingsProblem(product: DiscountProduct): string | null {
  const { discountEnabled, discountBirr, discountCode, priceBirr } = product;
  if (discountCode && !DISCOUNT_CODE_PATTERN.test(discountCode)) {
    return "Discount code: 3–20 letters or numbers (dashes and underscores allowed), no spaces.";
  }
  if (discountBirr !== null && discountBirr >= priceBirr) {
    return "Discount must be less than the product price.";
  }
  if (discountEnabled) {
    if (!discountCode) return "Add a discount code before turning the discount on.";
    if (!discountBirr) return "Add a discount amount before turning the discount on.";
  }
  return null;
}
