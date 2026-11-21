// The four trust badges under Buy Now on the product page. Each product
// stores its own (Product.trustBadges, editable in the admin product
// form); these are the defaults for new products and the DB default for
// existing ones. Keep in sync with the @default in prisma/schema.prisma.
// An empty badge is hidden. Icons are by position (product-showcase.tsx).
export const DEFAULT_TRUST_BADGES = [
  "Free Delivery",
  "Delivered within 2 hours",
  "Same day return",
  "Nothing to pay before delivery",
] as const;

export const TRUST_BADGE_COUNT = DEFAULT_TRUST_BADGES.length;
export const TRUST_BADGE_MAX_LENGTH = 40;
