import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PropertyGallery } from "@/components/organisms/property-gallery";
import { PropertyFeatures } from "@/components/organisms/property-features";
import { PropertyContactCard } from "@/components/organisms/property-contact-card";
import { PropertyCard } from "@/components/molecules/property-card";
import type { Property } from "@/types/property";

interface PropertyDetailTemplateProps {
  property: Property;
  related: Property[];
}

export function PropertyDetailTemplate({
  property,
  related,
}: PropertyDetailTemplateProps) {
  return (
    <div className="min-h-screen bg-centa-off-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-centa-green-1">
              Inicio
            </Link>
            <span>/</span>
            <Link
              href={property.kind === "development" ? "/emprendimientos" : "/catalogo"}
              className="hover:text-centa-green-1"
            >
              {property.kind === "development" ? "Emprendimientos" : "Catálogo"}
            </Link>
            <span>/</span>
            <span className="text-centa-black font-medium truncate max-w-[200px]">
              {property.titulo}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={property.kind === "development" ? "/emprendimientos" : "/catalogo"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-centa-green-1 mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" />
          {property.kind === "development" ? "Volver a emprendimientos" : "Volver al catálogo"}
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <PropertyGallery property={property} />
            <div className="lg:hidden">
              <PropertyContactCard property={property} />
            </div>
            <PropertyFeatures property={property} />
          </div>
          <div className="hidden space-y-4 lg:block">
            <PropertyContactCard property={property} />
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-centa-black">
                  Propiedades similares
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Si esta opción no encaja del todo, te dejamos alternativas cercanas para comparar mejor.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
