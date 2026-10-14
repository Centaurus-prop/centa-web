"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";

import { toggleFeaturedDevelopmentAction } from "./actions";
import { cn } from "@/lib/utils";

interface FeaturedDevToggleProps {
  developmentId: string;
  destacada: boolean;
}

export function FeaturedDevToggle({ developmentId, destacada }: FeaturedDevToggleProps) {
  const [pending, startTransition] = useTransition();
  const [isFeatured, setIsFeatured] = useState(destacada);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const previous = isFeatured;
        setIsFeatured(!previous);
        startTransition(async () => {
          const result = await toggleFeaturedDevelopmentAction(developmentId);
          if (result.ok) {
            setIsFeatured(result.destacada);
            return;
          }
          setIsFeatured(previous);
        });
      }}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full border transition-colors",
        isFeatured
          ? "border-centa-green-1/30 bg-centa-green-1/10 text-centa-green-1 hover:bg-centa-green-1/15"
          : "border-gray-200 bg-white text-gray-300 hover:text-gray-400",
        pending && "opacity-60",
      )}
      aria-label={isFeatured ? "Quitar de destacadas" : "Marcar como destacada"}
      aria-pressed={isFeatured}
    >
      <Star className={cn("size-4", isFeatured && "fill-current")} />
    </button>
  );
}
