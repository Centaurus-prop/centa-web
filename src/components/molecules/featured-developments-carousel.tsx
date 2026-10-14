"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimateOnScroll } from "@/components/atoms/animate-on-scroll";
import { DevelopmentGroupCard } from "@/components/molecules/development-group-card";
import type { DevelopmentGroup } from "@/lib/properties";

export function FeaturedDevelopmentsCarousel({ groups }: { groups: DevelopmentGroup[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi, updateButtons]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative mt-10">
      {/* Left arrow */}
      {canScrollPrev && (
        <button
          onClick={scrollPrev}
          aria-label="Anterior"
          className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/70 text-centa-green-1 shadow-md backdrop-blur-sm transition-all hover:bg-white/90 hover:scale-105 sm:-left-5 sm:size-11"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6 md:gap-7">
          {groups.map((group, i) => (
            <AnimateOnScroll
              key={group.developmentId}
              delay={i * 80}
              className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_calc(50%-0.875rem)] lg:flex-[0_0_calc(33.33%-1rem)]"
            >
              <DevelopmentGroupCard group={group} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>

      {/* Right arrow */}
      {canScrollNext && (
        <button
          onClick={scrollNext}
          aria-label="Siguiente"
          className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/70 text-centa-green-1 shadow-md backdrop-blur-sm transition-all hover:bg-white/90 hover:scale-105 sm:-right-5 sm:size-11"
        >
          <ChevronRight className="size-6" />
        </button>
      )}
    </div>
  );
}
