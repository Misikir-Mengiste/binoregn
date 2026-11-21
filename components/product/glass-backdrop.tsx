// Whitish product-page background: mostly white with very faint brand
// tints (green #0CB587, light green #B9EEBA, light blue #E4F5FF) blurred
// into soft light at the edges, fixed behind the content. Kept subtle on
// purpose — a clean, bright page reads as trustworthy. Static (no
// animation) to stay cheap on low-end phones. Parent must be
// `relative isolate`.
export function GlassBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white"
    >
      <div className="absolute -top-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-teal-600/[0.07] blur-3xl sm:h-[36rem] sm:w-[36rem]" />
      <div className="absolute top-[35%] -right-48 h-[26rem] w-[26rem] rounded-full bg-mint-200/30 blur-3xl sm:h-[34rem] sm:w-[34rem]" />
      <div className="absolute -bottom-56 left-[10%] h-[26rem] w-[26rem] rounded-full bg-blue-100/70 blur-3xl sm:h-[32rem] sm:w-[32rem]" />
    </div>
  );
}
