// Product names in tables are capped at 15 characters (user request,
// 2026-11-12) — "…" included — so long pasted names never stretch a
// column. Show the full name in a title tooltip and on detail pages.
export const TABLE_NAME_MAX = 15;

export function shortProductName(name: string, max = TABLE_NAME_MAX) {
  const trimmed = name.trim();
  return trimmed.length > max ? trimmed.slice(0, max - 1).trimEnd() + "…" : trimmed;
}
