"use client";

import { CategoryBadge, FeaturedBadge } from "@/components/atoms/category-badge";
import { InteractiveImageGallery } from "@/components/organisms/interactive-image-gallery";
import type { Property } from "@/types/property";

interface PropertyGalleryProps {
  property: Property;
}

export function PropertyGallery({ property }: PropertyGalleryProps) {
  const images = property.imagenes?.length
    ? property.imagenes.map((image) => ({
        src: image.url,
        alt: image.alt ?? property.titulo,
      }))
    : [{ src: property.imagenUrl, alt: property.titulo }];

  return (
    <InteractiveImageGallery
      images={images}
      priority
      imageSizes="(max-width: 1024px) 100vw, 66vw"
      className="space-y-6"
      thumbnailClassName="flex gap-3 overflow-x-auto pb-1"
      imageAltPrefix={property.titulo}
      overlay={(
        <>
          <CategoryBadge
            categoria={property.categoria}
            className="absolute left-4 top-4 z-10 px-3 py-1 text-sm"
          />
          {property.destacada && (
            <FeaturedBadge className="absolute right-4 top-4 z-10 px-3 py-1 text-sm" />
          )}
        </>
      )}
    />
  );
}
