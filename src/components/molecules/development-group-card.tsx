import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DevelopmentGroup } from "@/lib/properties";
import { primaryGlowClassName } from "@/lib/theme";

export function getStageLabel(group: DevelopmentGroup) {
  if (group.constructionDate) return "En construcción";
  return "Disponible";
}

export function getDevelopmentHref(group: DevelopmentGroup) {
  const developmentParam = encodeURIComponent(group.developmentName);
  return `/emprendimiento/${developmentParam}`;
}

export function DevelopmentGroupCard({ group }: { group: DevelopmentGroup }) {
  const heroImage = group.photos[0] ?? "/placeholder-property.svg";
  const description = group.description?.trim() || "Próximamente más información sobre este emprendimiento.";
  const location = group.location ?? group.address ?? "Buenos Aires";
  const totalUnits = group.units.reduce((sum, unit) => sum + unit.properties.length, 0);

  return (
    <Link
      href={getDevelopmentHref(group)}
      className="group relative block overflow-hidden rounded-[28px] border border-centa-green-1/10 bg-white shadow-[0_24px_70px_-42px_rgba(16,78,64,0.45)] transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      <article className="relative aspect-square overflow-hidden bg-centa-off-white">
        <Image
          src={heroImage}
          alt={group.developmentName}
          fill
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          unoptimized
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-6 pb-6 pt-14 transition-opacity duration-300 ease-out group-hover:opacity-0">
          <h2 className="text-2xl font-bold tracking-tight text-white">{group.developmentName}</h2>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-6 text-white opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
          <div className="space-y-3">
            <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              {getStageLabel(group)}
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">{group.developmentName}</h2>
              <p className="text-sm text-white/80">{location}</p>
            </div>
            <p className="line-clamp-2 text-sm leading-6 text-white/85">{description}</p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm text-white/70">
              {totalUnits} {totalUnits === 1 ? "unidad disponible" : "unidades disponibles"}
            </p>
            <span
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-centa-green-1 px-5 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-centa-green-1/90 ${primaryGlowClassName}`}
            >
              Ver unidades
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
