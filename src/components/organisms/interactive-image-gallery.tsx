"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageLightbox } from "@/components/organisms/image-lightbox";

interface GalleryImage {
  src: string;
  alt: string;
}

interface InteractiveImageGalleryProps {
  images: GalleryImage[];
  priority?: boolean;
  imageSizes?: string;
  className?: string;
  thumbnailClassName?: string;
  imageAltPrefix?: string;
  overlay?: React.ReactNode;
  showThumbnails?: boolean;
}

export function InteractiveImageGallery({
  images,
  priority = false,
  imageSizes = "(max-width: 1024px) 100vw, 70vw",
  className,
  thumbnailClassName,
  imageAltPrefix,
  overlay,
  showThumbnails = true,
}: InteractiveImageGalleryProps) {
  const safeImages = images.length > 0
    ? images
    : [{ src: "/placeholder-property.svg", alt: imageAltPrefix ?? "Imagen" }];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const selectedImage = safeImages[selectedIndex] ?? safeImages[0];
  const hasMultipleImages = safeImages.length > 1;

  function goToPrevious() {
    setSelectedIndex((current) => (current === 0 ? safeImages.length - 1 : current - 1));
  }

  function goToNext() {
    setSelectedIndex((current) => (current === safeImages.length - 1 ? 0 : current + 1));
  }

  return (
    <div className={className ?? "space-y-4"}>
      <div className="relative overflow-hidden rounded-[30px] border border-centa-green-1/10 bg-white shadow-[0_24px_70px_-42px_rgba(16,78,64,0.35)]">
        <div className="group relative aspect-[16/10] bg-centa-off-white">
          <button
            type="button"
            onClick={() => setLightboxIndex(selectedIndex)}
            className="absolute inset-0"
            aria-label="Abrir imagen en pantalla completa"
          >
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes={imageSizes}
              unoptimized
              priority={priority}
            />
          </button>

          {overlay}

          {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                aria-label="Ver foto anterior"
                className="absolute left-4 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-centa-green-1"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                aria-label="Ver foto siguiente"
                className="absolute right-4 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-centa-green-1"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
              <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/55 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                {selectedIndex + 1} / {safeImages.length}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {showThumbnails && hasMultipleImages ? (
        <div className={thumbnailClassName ?? "grid grid-cols-4 gap-3 sm:grid-cols-5"} aria-label="Miniaturas de la galería">
          {safeImages.map((image, index) => {
            const isSelected = index === selectedIndex;

            return (
              <button
                type="button"
                key={`${image.src}-${index}`}
                onClick={() => {
                  setSelectedIndex(index);
                  setLightboxIndex(index);
                }}
                aria-label={`Ver foto ${index + 1}`}
                aria-current={isSelected ? "true" : undefined}
                className={`relative overflow-hidden rounded-2xl border transition focus:outline-none focus:ring-2 focus:ring-centa-green-1 ${isSelected ? "border-centa-green-1 shadow-md" : "border-centa-green-1/10 hover:border-centa-green-1/30"}`}
              >
                <div className="relative aspect-[4/3] bg-white">
                  <Image src={image.src} alt={image.alt} fill className="object-cover" sizes="160px" unoptimized />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <ImageLightbox
        images={safeImages.map((image) => image.src)}
        imageAltPrefix={imageAltPrefix ?? safeImages[0]?.alt ?? "Imagen"}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrevious={() => setLightboxIndex((current) => (current === null ? 0 : (current - 1 + safeImages.length) % safeImages.length))}
        onNext={() => setLightboxIndex((current) => (current === null ? 0 : (current + 1) % safeImages.length))}
      />
    </div>
  );
}
