"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { PropertyCard } from "@/components/molecules/property-card";
import { AnimateOnScroll } from "@/components/atoms/animate-on-scroll";
import type { Property } from "@/types/property";

interface PropertyGridProps {
  properties: Property[];
  showViewAll?: boolean;
  title?: string;
  eyebrow?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function PropertyGrid({
  properties,
  showViewAll = true,
  title = "Seleccionadas para vos",
  eyebrow = "Propiedades destacadas",
  viewAllHref = "/catalogo",
  viewAllLabel = "Ver todas",
}: PropertyGridProps) {
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
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="section-eyebrow">{eyebrow}</p>
              <h2 className="section-title">{title}</h2>
            </div>
            {showViewAll && (
              <Link
                href={viewAllHref}
                className="cta-secondary gap-1.5 px-4 py-2"
              >
                {viewAllLabel}
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </AnimateOnScroll>

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
              {properties.map((property, i) => (
                <AnimateOnScroll
                  key={property.id}
                  delay={i * 80}
                  className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_calc(50%-0.875rem)] lg:flex-[0_0_calc(25%-1.05rem)]"
                >
                  <PropertyCard property={property} />
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
      </div>
    </section>
  );
}
