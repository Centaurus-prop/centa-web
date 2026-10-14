"use client";

import Image from "next/image";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  imageAltPrefix: string;
  activeIndex: number | null;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function ImageLightbox({
  images,
  imageAltPrefix,
  activeIndex,
  onClose,
  onPrevious,
  onNext,
}: ImageLightboxProps) {
  useEffect(() => {
    if (activeIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (images.length > 1 && event.key === "ArrowLeft") onPrevious();
      if (images.length > 1 && event.key === "ArrowRight") onNext();
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length, onClose, onNext, onPrevious]);

  if (activeIndex === null) return null;

  const currentImage = images[activeIndex] ?? images[0] ?? "/placeholder-property.svg";
  const hasMultipleImages = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Galería de imágenes en pantalla completa"
      onClick={onClose}
    >
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
          aria-label="Cerrar galería"
        >
          <X className="size-5" />
        </button>

        {hasMultipleImages ? (
          <button
            type="button"
            onClick={onPrevious}
            className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70 sm:left-6"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : null}

        <div className="relative flex h-full max-h-[88vh] w-full max-w-6xl items-center justify-center overflow-hidden rounded-[28px] bg-black/40">
          <Image
            src={currentImage}
            alt={`${imageAltPrefix} ${activeIndex + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            unoptimized
            priority
          />
        </div>

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70 sm:right-6"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
