"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const main = images[active];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="overflow-hidden rounded-[24px] bg-surface-0 shadow-card">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={main}
            alt=""
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="aspect-square w-full bg-gradient-to-br from-teal-100 to-blue-100" />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto sm:gap-4">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "aspect-square w-20 shrink-0 overflow-hidden rounded-[16px] border-2 bg-surface-100 sm:w-24",
                index === active ? "border-teal-600" : "border-transparent",
              )}
              aria-label={`View image ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
