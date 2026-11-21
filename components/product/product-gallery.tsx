"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Product images. The main image is a native scroll-snap carousel, so it
// swipes with a finger on phones and with a trackpad on laptops — no
// gesture library. Thumbnails, arrows (sm+), dots (mobile) and the
// keyboard arrows all scroll the same strip; the active index is read
// back from the scroll position, so every input stays in sync.
export function ProductGallery({ images }: { images: string[] }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const count = images.length;

  function goTo(index: number) {
    const strip = stripRef.current;
    if (!strip || count === 0) return;
    const next = Math.max(0, Math.min(count - 1, index));
    strip.scrollTo({ left: next * strip.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const strip = stripRef.current;
    if (!strip || strip.clientWidth === 0) return;
    const index = Math.round(strip.scrollLeft / strip.clientWidth);
    if (index !== active) setActive(index);
  }

  if (count === 0) {
    return (
      <div className="aspect-square w-full rounded-[24px] bg-gradient-to-br from-teal-100 to-blue-100 shadow-card" />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="group relative overflow-hidden rounded-[0px] bg-surface-0 shadow-card">
        <div
          ref={stripRef}
          onScroll={handleScroll}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") goTo(active + 1);
            if (event.key === "ArrowLeft") goTo(active - 1);
          }}
          tabIndex={count > 1 ? 0 : -1}
          role={count > 1 ? "region" : undefined}
          aria-roledescription={count > 1 ? "carousel" : undefined}
          aria-label="Product images"
          className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setViewerIndex(index)}
              className="w-full shrink-0 cursor-zoom-in snap-center"
              aria-label={`View image ${index + 1} of ${count} full screen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                draggable={false}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="aspect-square w-full select-none object-cover"
              />
            </button>
          ))}
        </div>

        <span className="pointer-events-none absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-foreground shadow-card">
          <Expand className="h-4 w-4" />
        </span>

        {count > 1 ? (
          <>
            {/* Arrows: tablet/desktop only — phones swipe. */}
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card transition-opacity hover:bg-card disabled:opacity-0 sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              disabled={active === count - 1}
              aria-label="Next image"
              className="absolute top-1/2 right-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card transition-opacity hover:bg-card disabled:opacity-0 sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Position: dots on phones, counter on larger screens. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
              {images.map((url, index) => (
                <span
                  key={url}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === active ? "w-5 bg-teal-600" : "w-1.5 bg-white/80",
                  )}
                />
              ))}
            </div>
            <span className="absolute right-3 bottom-3 hidden rounded-pill bg-ink-900/60 px-2.5 py-1 text-xs font-medium text-white sm:block">
              {active + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {count > 1 && (
        <div className="scrollbar-hide flex gap-3 overflow-x-auto sm:gap-4">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(index)}
              className={cn(
                "aspect-square w-16 shrink-0 overflow-hidden rounded-[0px] border-2 bg-surface-100 transition-colors sm:w-20",
                index === active ? "border-teal-600" : "border-transparent hover:border-border",
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={index === active}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {viewerIndex !== null ? (
        <ImageViewer
          images={images}
          start={viewerIndex}
          onClose={(lastIndex) => {
            setViewerIndex(null);
            goTo(lastIndex);
          }}
        />
      ) : null}
    </div>
  );
}

// Full-screen image viewer: whole image (object-contain) on a dark
// backdrop, swipe / arrows / arrow keys between images, closes with the
// X, Esc, or a tap on the backdrop. Portalled to <body> so the sticky
// header and the mobile Buy Now bar can't sit on top of it; page scroll is
// locked while open.
function ImageViewer({
  images,
  start,
  onClose,
}: {
  images: string[];
  start: number;
  onClose: (lastIndex: number) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(start);
  const indexRef = useRef(start);
  const count = images.length;

  function goTo(next: number) {
    const strip = stripRef.current;
    if (!strip) return;
    const clamped = Math.max(0, Math.min(count - 1, next));
    strip.scrollTo({ left: clamped * strip.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    const strip = stripRef.current;
    if (strip) strip.scrollLeft = start * strip.clientWidth;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose(indexRef.current);
      if (event.key === "ArrowRight") goTo(indexRef.current + 1);
      if (event.key === "ArrowLeft") goTo(indexRef.current - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on open
  }, []);

  function handleScroll() {
    const strip = stripRef.current;
    if (!strip || strip.clientWidth === 0) return;
    const next = Math.round(strip.scrollLeft / strip.clientWidth);
    indexRef.current = next;
    if (next !== index) setIndex(next);
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product images"
      className="fixed inset-0 z-[100] flex flex-col bg-ink-900/95 animate-in fade-in-0 duration-200"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">
          {index + 1} / {count}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={() => onClose(indexRef.current)}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={stripRef}
          onScroll={handleScroll}
          className="scrollbar-hide flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain"
        >
          {images.map((url) => (
            <div
              key={url}
              className="flex h-full w-full shrink-0 snap-center items-center justify-center p-3 sm:p-8"
              onClick={(event) => {
                // Tap on the dark area (not the image) closes.
                if (event.target === event.currentTarget) onClose(indexRef.current);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                draggable={false}
                className="max-h-full max-w-full select-none rounded-[0px] object-contain"
              />
            </div>
          ))}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous image"
              className="absolute top-1/2 left-4 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 disabled:opacity-0 sm:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === count - 1}
              aria-label="Next image"
              className="absolute top-1/2 right-4 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 disabled:opacity-0 sm:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="flex justify-center gap-1.5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {images.map((url, i) => (
            <span
              key={url}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/40",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
