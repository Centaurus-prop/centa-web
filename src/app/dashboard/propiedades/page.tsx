import Link from "next/link";
import Image from "next/image";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import { FeaturedToggle } from "./featured-toggle";
import { PageHeader } from "@/components/atoms/page-header";
import { EmptyState } from "@/components/atoms/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/components/atoms/price-display";
import { getDashboardProperties, getDashboardPropertySummary } from "@/lib/properties";
import type {
  DevelopmentStage,
  Property,
  PropertyKind,
  PublishStatus,
} from "@/types/property";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<Property["estado"], { label: string; className: string }> = {
  disponible: { label: "Disponible", className: "bg-centa-green-3/20 text-centa-green-1 border-centa-green-3/40" },
  reservado: { label: "Reservado", className: "bg-amber-50 text-amber-700 border-amber-200" },
  vendido: { label: "Vendido", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const CATEGORY_LABELS: Record<Property["categoria"], string> = {
  "a-estrenar": "A estrenar",
  usado: "Usado",
  emprendimiento: "Emprendimiento",
};

const SOURCE_LABELS: Record<"tokko" | "local" | "mock", string> = {
  tokko: "Tokko",
  local: "Local",
  mock: "Mock",
};

const SOURCE_FILTER_OPTIONS = [
  { value: "todos", label: "Todas" },
  { value: "tokko", label: "Tokko" },
  { value: "local", label: "Local" },
] as const;

type SourceFilterValue = (typeof SOURCE_FILTER_OPTIONS)[number]["value"];

const KIND_LABELS: Record<PropertyKind, string> = {
  property: "Propiedad",
  development: "Desarrollo",
};

const PUBLISH_LABELS: Record<PublishStatus, string> = {
  draft: "Borrador",
  review: "Revisión",
  published: "Publicado",
  archived: "Archivado",
};

const STAGE_LABELS: Record<DevelopmentStage, string> = {
  none: "Sin etapa",
  upcoming: "Próximo",
  active: "Activo",
  delivered: "Entregado",
};

export default async function DashboardPropertiesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const sourceParam = typeof params.source === "string" ? params.source : "todos";
  const source: SourceFilterValue = SOURCE_FILTER_OPTIONS.some((option) => option.value === sourceParam)
    ? (sourceParam as SourceFilterValue)
    : "todos";
  const kind = typeof params.kind === "string" ? (params.kind as PropertyKind | "todos") : "todos";
  const publishStatus = typeof params.publishStatus === "string"
    ? (params.publishStatus as PublishStatus | "todos")
    : "todos";
  const developmentStage = typeof params.developmentStage === "string"
    ? (params.developmentStage as DevelopmentStage | "todos")
    : "todos";

  const properties = await getDashboardProperties({
    source,
    kind,
    publishStatus,
    developmentStage,
  });
  const summary = await getDashboardPropertySummary(properties);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propiedades"
        description="Items sincronizados + contenido local administrado desde el dashboard. Tokko sigue en modo solo lectura."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/catalogo"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-centa-black transition-colors hover:bg-gray-50"
            >
              <ExternalLink className="size-4" />
              Ver catálogo público
            </Link>
          </div>
        }
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold text-centa-black">{summary.total}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Disponibles: </span>
          <span className="font-semibold text-centa-black">{summary.available}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Destacadas: </span>
          <span className="font-semibold text-centa-black">{summary.featured}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Fuentes: </span>
          <span className="font-semibold text-centa-black">
            {Object.entries(summary.sourceBreakdown)
              .map(([key, value]) => `${SOURCE_LABELS[(key as keyof typeof SOURCE_LABELS)] ?? key}: ${value}`)
              .join(" · ") || "—"}
          </span>
        </div>
      </div>

      <form className="grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] md:grid-cols-2 xl:grid-cols-4">
        <FilterSelect
          name="source"
          label="Fuente"
          value={source}
          options={[...SOURCE_FILTER_OPTIONS]}
        />
        <FilterSelect
          name="kind"
          label="Tipo interno"
          value={kind}
          options={[
            { value: "todos", label: "Todos" },
            { value: "property", label: "Propiedad" },
            { value: "development", label: "Desarrollo" },
          ]}
        />
        <FilterSelect
          name="publishStatus"
          label="Estado editorial"
          value={publishStatus}
          options={[
            { value: "todos", label: "Todos" },
            { value: "draft", label: "Borrador" },
            { value: "review", label: "Revisión" },
            { value: "published", label: "Publicado" },
            { value: "archived", label: "Archivado" },
          ]}
        />
        <FilterSelect
          name="developmentStage"
          label="Etapa desarrollo"
          value={developmentStage}
          options={[
            { value: "todos", label: "Todas" },
            { value: "none", label: "Sin etapa" },
            { value: "upcoming", label: "Próximo" },
            { value: "active", label: "Activo" },
            { value: "delivered", label: "Entregado" },
          ]}
        />
        <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-2">
          <Link
            href="/dashboard/propiedades"
            className="inline-flex h-10 items-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-centa-black hover:bg-gray-50"
          >
            Limpiar
          </Link>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-lg bg-centa-green-1 px-4 text-sm font-semibold text-white hover:bg-centa-green-1/90"
          >
            Aplicar filtros
          </button>
        </div>
      </form>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hay propiedades para esos filtros"
          description="Probá cambiar fuente, tipo o estado editorial."
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04]">
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">★</th>
                  <th className="px-4 py-3 text-left font-medium">Propiedad</th>
                  <th className="px-4 py-3 text-left font-medium">Ubicación</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Editorial</th>
                  <th className="px-4 py-3 text-left font-medium">Precio</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((property) => {
                  const statusVariant = STATUS_VARIANT[property.estado];
                  return (
                    <tr key={property.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-3 align-top">
                        <FeaturedToggle propertyId={property.id} destacada={property.destacada} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                            <Image
                              src={property.imagenUrl}
                              alt={property.titulo}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium text-centa-black">{property.titulo}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-[10px]">
                                {CATEGORY_LABELS[property.categoria]}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {SOURCE_LABELS[property.fuente ?? "mock"]}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {KIND_LABELS[property.kind ?? "property"]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                        <p className="text-centa-black">{property.barrio}</p>
                        <p>{property.ciudad}</p>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-centa-black">
                        <p>{KIND_LABELS[property.kind ?? "property"]}</p>
                        <p className="text-muted-foreground">{STAGE_LABELS[property.developmentStage ?? "none"]}</p>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-centa-black">
                        <p>{PUBLISH_LABELS[property.publishStatus ?? "published"]}</p>
                        <p className="text-muted-foreground">{property.destacada ? "Destacada" : "Normal"}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top font-semibold text-centa-green-1">
                        {formatPrice(property.precio, property.moneda)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusVariant.className}`}
                        >
                          {statusVariant.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <Link
                          href={`/propiedad/${property.slug ?? property.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-centa-green-1 hover:underline"
                        >
                          Ver
                          <ExternalLink className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-gray-100 md:hidden">
            {properties.map((property) => {
              const statusVariant = STATUS_VARIANT[property.estado];
              return (
                <li key={property.id} className="flex gap-3 p-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={property.imagenUrl}
                      alt={property.titulo}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 font-medium text-centa-black">{property.titulo}</p>
                      <FeaturedToggle propertyId={property.id} destacada={property.destacada} />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {property.barrio}, {property.ciudad}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {SOURCE_LABELS[property.fuente ?? "mock"]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {KIND_LABELS[property.kind ?? "property"]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {PUBLISH_LABELS[property.publishStatus ?? "published"]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-centa-green-1">
                        {formatPrice(property.precio, property.moneda)}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusVariant.className}`}
                      >
                        {statusVariant.label}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-centa-black">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
