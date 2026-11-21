import { cn } from "@/lib/utils";

// Official Binoregn wordmark. public/brand/logo.png is the brand artwork
// (public/binoregn-logo.png) trimmed to the letters and scaled to 600px
// wide (~11 KB instead of 159 KB — it's on every page). Aspect ≈ 4.6:1;
// size by height, e.g. "h-6". variant="white" has white lettering and
// light-green dots for green/dark backgrounds.
export function Logo({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "white";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "white" ? "/brand/logo-white.png" : "/brand/logo.png"}
      alt="Binoregn"
      width={600}
      height={131}
      className={cn("w-auto object-contain", className)}
    />
  );
}

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
