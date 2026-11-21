// The order number buyers see on their confirmation screen and quote
// when they call — and the same one admin sees, so the two can be
// matched. Uses the END of the cuid: its start is mostly a timestamp,
// so orders placed close together share a prefix.
export function orderNumber(orderId: string) {
  return orderId.slice(-8).toUpperCase();
}
