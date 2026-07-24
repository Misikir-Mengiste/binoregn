import { cn } from "@/lib/utils";

// Binoregn brand mark — a teal rounded square with a bold "B", mirroring the
// app icon. Pass sizing (e.g. "h-9 w-9 text-sm") via className.
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] bg-teal-600 font-bold leading-none text-white",
        className,
      )}
      aria-hidden
    >
      B
    </span>
  );
}

// Wordmark "Binoregn." with the teal period accent from the logo.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold tracking-tight", className)}>
      Binoregn<span className="text-teal-600">.</span>
    </span>
  );
}
