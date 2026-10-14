import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import { PriceDisplay } from "@/components/atoms/price-display";
import { elevatedSurfaceClassName } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
  className?: string;
}

function FactSeparator() {
  return <span className="property-card-fact-separator">·</span>;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const areaLabel = property.superficieTotal ?? property.superficieCubierta ?? (property.m2 > 0 ? property.m2 : null);
  const locationLabel = property.barrio || property.ciudad || property.ubicacion;

  const facts: { icon: React.ReactNode; label: string }[] = [];
  if (areaLabel) facts.push({ icon: <Maximize className="inline size-3.5 align-[-2px]" />, label: `${areaLabel} m²` });
  if (property.ambientes && property.ambientes > 0) facts.push({ icon: <BedDouble className="inline size-3.5 align-[-2px]" />, label: `${property.ambientes} amb` });
  if (property.banos && property.banos > 0) facts.push({ icon: <Bath className="inline size-3.5 align-[-2px]" />, label: `${property.banos} ${property.banos === 1 ? "baño" : "baños"}` });

  return (
    <Link
      href={`/propiedad/${property.slug ?? property.id}`}
      className={cn("group block h-full", className)}
    >
      <article className={cn(`${elevatedSurfaceClassName} overflow-hidden`, "flex h-full flex-col")}>
        <div className="relative aspect-[16/10] w-full flex-shrink-0 overflow-hidden bg-centa-off-white">
          <Image
            src={property.imagenUrl}
            alt={property.titulo}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div className="space-y-3">
            <PriceDisplay precio={property.precio} moneda={property.moneda} className="text-2xl leading-none" />

            <h3 className="line-clamp-2 min-h-[3.25rem] text-lg font-semibold leading-snug text-centa-black">
            {property.titulo}
            </h3>
          </div>

          <div className="flex min-h-[3.5rem] items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-centa-green-1" />
            <div className="space-y-0.5">
              <p className="font-medium text-centa-black/90">{locationLabel}</p>
              {property.direccion && property.direccion !== locationLabel ? (
                <p className="line-clamp-1">{property.direccion}</p>
              ) : (
                <p className="line-clamp-1">{property.ubicacion}</p>
              )}
            </div>
          </div>

          <div className="mt-auto border-t border-border/80 pt-2.5">
            <p className="property-card-facts text-xs font-medium text-centa-black/78 sm:text-[13px]">
              {facts.length > 0
                ? facts.map((f, i) => (
                    <span key={i}>
                      {i > 0 && <FactSeparator />}
                      <span className="property-card-fact">{f.icon} {f.label}</span>
                    </span>
                  ))
                : <span className="text-centa-black/40">Consultar características</span>
              }
            </p>
          </div>

          {property.expensas !== null ? (
            <p className="text-[13px] text-muted-foreground">
              Expensas:{" "}
              <span className="font-medium text-centa-black">
                {property.expensas === 0 ? "Sin expensas" : `${property.moneda === "USD" ? "USD " : "$ "}${(property.expensas ?? 0).toLocaleString("es-AR")}`}
              </span>
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
