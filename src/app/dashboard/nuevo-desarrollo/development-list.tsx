"use client";

import type { JSX } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { deleteDevelopmentAction } from "./actions";
import { FeaturedDevToggle } from "./featured-dev-toggle";
import { FeaturedTokkoGroupToggle } from "./featured-tokko-group-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Development } from "@/lib/developments";
import type { DevelopmentGroup } from "@/lib/properties";

function formatDate(value?: string) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(development: Development) {
  if (development.status === "active") return "Activo";
  if (development.status === "delivered") return "Entregado";
  if (development.status === "upcoming") return development.published ? "Próximamente" : "Borrador";
  return development.published ? "Publicado" : "Borrador";
}

function getStatusClassName(development: Development) {
  if (development.status === "active") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (development.status === "delivered") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  if (development.status === "upcoming") {
    return development.published
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-centa-green-1/10 bg-centa-off-white text-centa-green-1";
  }

  return development.published
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-centa-green-1/10 bg-centa-off-white text-centa-green-1";
}

function DevelopmentListItem({ development }: { development: Development }): JSX.Element {
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar este desarrollo?")) return;

    const result = await deleteDevelopmentAction(development.id);
    if (!result.ok) {
      window.alert(result.message);
      return;
    }

    router.refresh();
  };

  return (
    <article className="grid gap-4 rounded-[24px] border border-centa-green-1/10 bg-white p-4 shadow-[0_24px_60px_-40px_rgba(0,58,42,0.28)] sm:grid-cols-[auto_112px_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
      <div className="flex items-start justify-center sm:justify-start">
        <FeaturedDevToggle developmentId={development.id} destacada={development.destacada} />
      </div>

      <div className="relative h-28 overflow-hidden rounded-2xl bg-centa-off-white sm:h-24 sm:w-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={development.coverImage || "/placeholder-property.svg"}
          alt={development.name}
          className="size-full object-cover"
        />
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-centa-black">
            {development.name}
          </h3>
          <Badge className={getStatusClassName(development)}>{getStatusLabel(development)}</Badge>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{development.location || development.address || development.city}</p>
          <p>Creado: {formatDate(development.createdAt)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button variant="outline" size="sm" render={<Link href={`/dashboard/nuevo-desarrollo?id=${development.id}`} />}>
          <Pencil className="size-4" />
          Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="size-4" />
          Eliminar
        </Button>
      </div>
    </article>
  );
}

function TokkoGroupListItem({ group }: { group: DevelopmentGroup }): JSX.Element | null {
  const totalUnits = group.units.reduce((count, unit) => count + unit.properties.length, 0);
  const leadProperty = group.units[0]?.properties[0];
  const image = group.photos[0] || leadProperty?.imagenUrl || "/placeholder-property.svg";
  const destacada = group.units.some((unit) => unit.properties.some((property) => property.destacada));

  if (!leadProperty) return null;

  return (
    <article className="grid gap-4 rounded-[24px] border border-centa-green-1/10 bg-white p-4 shadow-[0_24px_60px_-40px_rgba(0,58,42,0.28)] sm:grid-cols-[auto_112px_minmax(0,1fr)] sm:items-center sm:gap-5">
      <div className="flex items-start justify-center sm:justify-start">
        <FeaturedTokkoGroupToggle propertyId={leadProperty.id} destacada={destacada} />
      </div>

      <div className="relative h-28 overflow-hidden rounded-2xl bg-centa-off-white sm:h-24 sm:w-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={group.developmentName}
          className="size-full object-cover"
        />
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-centa-black">{group.developmentName}</h3>
          <Badge className="border-sky-200 bg-sky-50 text-sky-700">Tokko</Badge>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{group.location || group.address || "Sin ubicación"}</p>
          <p>{totalUnits} unidades</p>
        </div>
      </div>
    </article>
  );
}

export function DevelopmentList({
  properties: developments,
  tokkoGroups,
}: {
  properties: Development[];
  tokkoGroups: DevelopmentGroup[];
}): JSX.Element {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-centa-black">Desarrollos existentes</h2>
          <p className="text-sm text-muted-foreground">
            Gestioná los desarrollos próximos cargados manualmente en Centa.
          </p>
        </div>

        {developments.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-centa-green-1/15 bg-centa-off-white px-6 py-10 text-center text-sm text-muted-foreground">
            No hay desarrollos próximos cargados.
          </div>
        ) : (
          <div className="space-y-3">
            {developments.map((development) => (
              <DevelopmentListItem key={development.id} development={development} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-centa-black">Grupos de Tokko</h2>
          <p className="text-sm text-muted-foreground">
            Desarrollos agrupados automáticamente desde Tokko por developmentId.
          </p>
        </div>

        {tokkoGroups.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-centa-green-1/15 bg-centa-off-white px-6 py-10 text-center text-sm text-muted-foreground">
            No hay grupos de Tokko disponibles.
          </div>
        ) : (
          <div className="space-y-3">
            {tokkoGroups.map((group) => (
              <TokkoGroupListItem key={group.developmentId} group={group} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
