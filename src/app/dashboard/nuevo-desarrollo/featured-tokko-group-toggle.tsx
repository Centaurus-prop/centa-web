"use client";

import { Star } from "lucide-react";
import { useState, useTransition } from "react";

import { toggleFeaturedAction } from "../propiedades/actions";
import { cn } from "@/lib/utils";

export function FeaturedTokkoGroupToggle({ propertyId, destacada }: { propertyId: string; destacada: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [isFeatured, setIsFeatured] = useState(destacada);

  return (
    <button
      type="button"
      onClick={() => {
        const previous = isFeatured;
        setIsFeatured(!previous);
        startTransition(async () => {
          const result = await toggleFeaturedAction(propertyId);
          if (result.ok) {
            setIsFeatured(result.destacada);
            return;
          }
          setIsFeatured(previous);
        });
      }}
      disabled={isPending}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full border transition-colors",
        isFeatured
          ? "border-centa-green-1/30 bg-centa-green-1/10 text-centa-green-1 hover:bg-centa-green-1/15"
          : "border-gray-200 bg-white text-gray-300 hover:text-gray-400",
        isPending && "opacity-60",
      )}
      aria-label={isFeatured ? "Quitar de destacadas" : "Marcar como destacada"}
      aria-pressed={isFeatured}
    >
      <Star className={cn("size-4", isFeatured && "fill-current")} />
    </button>
  );
}
