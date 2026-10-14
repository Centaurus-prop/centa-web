"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, MapPin, MessageCircle } from "lucide-react";
import { formatPrice } from "@/components/atoms/price-display";
import { ContactForm } from "@/components/molecules/contact-form";
import { GooglePropertyMap } from "@/components/molecules/google-property-map";
import { InteractiveImageGallery } from "@/components/organisms/interactive-image-gallery";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildWhatsAppUrl, SITE_URL } from "@/lib/whatsapp";
import type { DevelopmentGroup } from "@/lib/properties";
import type { Property } from "@/types/property";

interface DevelopmentDetailTemplateProps {
  group: DevelopmentGroup;
}

function buildMapUrl(lat: number, lng: number) {
  const delta = 0.006;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

function buildOpenStreetMapUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

function buildGoogleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function getStatusLabel(group: DevelopmentGroup) {
  return group.constructionDate ? "En construcción" : "Disponible";
}

function getAllUnits(group: DevelopmentGroup) {
  return group.units.flatMap((unit) => unit.properties);
}

function getPriceRange(properties: Property[]) {
  const valid = properties.filter((property) => property.precio > 0);
  if (valid.length === 0) return null;

  const prices = valid.map((property) => property.precio);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const moneda = valid[0]?.moneda ?? "USD";

  return {
    min,
    max,
    moneda,
  };
}

function getAmbientesTabs(group: DevelopmentGroup) {
  return [
    { value: "todos", label: "Todos" },
    ...group.units.map((unit) => ({ value: String(unit.ambientes), label: unit.label })),
  ];
}

function resolvePropertyHref(property: Property) {
  return `/propiedad/${property.slug ?? property.id}`;
}

export function DevelopmentDetailTemplate({ group }: DevelopmentDetailTemplateProps) {
  const allUnits = useMemo(() => getAllUnits(group), [group]);
  const tabs = useMemo(() => getAmbientesTabs(group), [group]);
  const [activeTab, setActiveTab] = useState("todos");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const pathname = usePathname();
  const url = `${SITE_URL}${pathname}`;

  const filteredUnits = useMemo(() => {
    if (activeTab === "todos") return allUnits;
    return allUnits.filter((property) => String(Math.max(0, Math.round(property.ambientes ?? 0))) === activeTab);
  }, [activeTab, allUnits]);

  const priceRange = useMemo(() => getPriceRange(allUnits), [allUnits]);
  const unitCount = allUnits.length;
  const galleryImages = (group.photos.length > 0 ? group.photos : ["/placeholder-property.svg"]).map((photo, index) => ({
    src: photo,
    alt: `${group.developmentName} ${index + 1}`,
  }));
  const isLongDescription = (group.description?.length ?? 0) > 280;
  const description = group.description?.trim() || "Próximamente más información sobre este emprendimiento.";
  const shortDescription = isLongDescription && !showFullDescription
    ? `${description.slice(0, 280).trimEnd()}…`
    : description;

  const coordinates = group.coordinates;
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapUrl = coordinates ? buildMapUrl(coordinates.lat, coordinates.lng) : null;
  const openStreetMapUrl = coordinates ? buildOpenStreetMapUrl(coordinates.lat, coordinates.lng) : null;
  const googleMapsUrl = coordinates ? buildGoogleMapsUrl(coordinates.lat, coordinates.lng) : null;

  return (
    <div className="bg-centa-off-white py-10 sm:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <nav className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-centa-green-1">Inicio</Link></li>
            <li>/</li>
            <li><Link href="/emprendimientos" className="hover:text-centa-green-1">Emprendimientos</Link></li>
            <li>/</li>
            <li className="text-centa-black">{group.developmentName}</li>
          </ol>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_440px]">
          <div className="space-y-8">
            <InteractiveImageGallery
              images={galleryImages}
              priority
              imageSizes="(max-width: 1024px) 100vw, 70vw"
              className="space-y-4"
              imageAltPrefix={group.developmentName}
              showThumbnails={false}
            />

            <section className="space-y-5">
              <div>
                <p className="section-eyebrow">Tipologías</p>
                <h2 className="section-title">Unidades disponibles</h2>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="surface-panel h-auto flex-wrap justify-start gap-2 rounded-2xl border-[var(--color-centa-border-soft)] p-1.5">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="pill-label min-h-10 border border-[var(--color-centa-border-soft)] bg-transparent px-4 text-[0.7rem] text-centa-green-1 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {filteredUnits.length > 0 ? (
                <div className="surface-panel divide-y divide-[var(--color-centa-border-soft)] overflow-hidden p-0">
                  {filteredUnits.map((property) => {
                    const coveredSurface = property.superficieCubierta ? `${property.superficieCubierta.toLocaleString("es-AR")} m² cub` : "Cubierta consultar";
                    const totalSurface = property.superficieTotal ? `${property.superficieTotal.toLocaleString("es-AR")} m² total` : `${property.m2.toLocaleString("es-AR")} m² total`;
                    const thumbnail = property.imagenUrl || "/placeholder-property.svg";

                    return (
                      <Link
                        key={property.id}
                        href={resolvePropertyHref(property)}
                        className="group flex w-full flex-col gap-4 px-4 py-4 transition hover:bg-white/70 hover:shadow-[0_10px_30px_-24px_rgba(16,24,40,0.45)] sm:px-5 md:flex-row md:items-center md:gap-5"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-centa-off-white sm:max-w-[140px] md:w-[120px] md:min-w-[120px]">
                          <Image
                            src={thumbnail}
                            alt={property.titulo}
                            fill
                            sizes="(max-width: 768px) 100vw, 120px"
                            className="object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-centa-black sm:text-lg">{property.titulo}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{property.ambientes <= 1 ? `${property.ambientes || 1} Ambiente` : `${property.ambientes} Ambientes`}</p>
                          <p className="mt-2 text-sm text-centa-black/80">{coveredSurface} / {totalSurface}</p>
                        </div>

                        <div className="flex items-center justify-between gap-3 md:min-w-[220px] md:justify-end">
                          <p className="text-lg font-bold text-centa-green-1 sm:text-xl">{formatPrice(property.precio, property.moneda)}</p>
                          <ChevronRight className="size-5 text-centa-green-1 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="surface-panel flex min-h-48 items-center justify-center px-6 py-12 text-center text-muted-foreground">
                  No encontramos unidades para este filtro.
                </div>
              )}
            </section>

            <section className="surface-panel p-6 sm:p-7">
              <h2 className="section-title text-2xl sm:text-3xl">Descripción</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{shortDescription}</p>
              {isLongDescription ? (
                <button
                  type="button"
                  onClick={() => setShowFullDescription((value) => !value)}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-centa-green-1"
                >
                  {showFullDescription ? "Ver menos" : "Ver más"}
                  <ChevronDown className={`size-4 transition ${showFullDescription ? "rotate-180" : ""}`} />
                </button>
              ) : null}
            </section>

            {group.amenities.length > 0 ? (
              <section className="surface-panel p-6 sm:p-7">
                <h2 className="section-title text-2xl sm:text-3xl">Amenities</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  {group.amenities.map((amenity) => (
                    <span key={amenity} className="pill-label border-primary/15 bg-primary/8 text-centa-green-1">
                      {amenity}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="surface-panel overflow-hidden p-6 sm:p-7">
              <h2 className="section-title text-2xl sm:text-3xl">Ubicación</h2>
              <p className="mt-4 text-sm text-muted-foreground">{group.address ?? group.location ?? "Buenos Aires"}</p>
              <div className="mt-5 overflow-hidden rounded-2xl border border-centa-green-1/10">
                {coordinates && mapUrl && openStreetMapUrl ? (
                  googleMapsApiKey && googleMapsUrl ? (
                    <>
                      <GooglePropertyMap
                        apiKey={googleMapsApiKey}
                        lat={coordinates.lat}
                        lng={coordinates.lng}
                        title={group.developmentName}
                        fallbackMapUrl={mapUrl}
                        fallbackLinkUrl={openStreetMapUrl}
                      />
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-white px-4 py-2 text-sm font-medium text-centa-green-1 transition hover:bg-centa-off-white"
                      >
                        Ver mapa ampliado en Google Maps
                      </a>
                    </>
                  ) : (
                    <>
                      <iframe
                        title={`Mapa de ${group.developmentName}`}
                        src={mapUrl}
                        className="aspect-[16/7] w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                      <a
                        href={openStreetMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-white px-4 py-2 text-sm font-medium text-centa-green-1 transition hover:bg-centa-off-white"
                      >
                        Ver mapa ampliado
                      </a>
                    </>
                  )
                ) : (
                  <div className="flex aspect-[16/7] items-center justify-center bg-centa-off-white px-6 text-center text-sm text-muted-foreground">
                    Mapa no disponible para este emprendimiento.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="surface-panel p-6 sm:p-7">
              <div className="space-y-4">
                <span className="pill-label">{getStatusLabel(group)}</span>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-centa-black sm:text-4xl">{group.developmentName}</h1>
                  <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-centa-green-1" />
                    <div>
                      <p>{group.location ?? "Buenos Aires"}</p>
                      {group.address ? <p>{group.address}</p> : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-centa-off-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Unidades</p>
                    <p className="mt-2 text-2xl font-bold text-centa-black">{unitCount}</p>
                  </div>
                  <div className="rounded-2xl bg-centa-off-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Entrega estimada</p>
                    <p className="mt-2 text-lg font-bold text-centa-black">{group.constructionDate ?? "Consultar"}</p>
                  </div>
                  <div className="rounded-2xl bg-centa-off-white p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Precios desde</p>
                    <p className="mt-2 text-2xl font-bold text-centa-green-1">
                      {priceRange
                        ? `Desde ${formatPrice(priceRange.min, priceRange.moneda)}`
                        : "Consultar"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-panel p-5 sm:p-6">
              <p className="section-eyebrow">Contacto</p>
              <h2 className="section-title text-xl sm:text-2xl">Consultá este emprendimiento</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Te compartimos disponibilidad actualizada, valores y formas de pago.
              </p>
              <div className="mt-4">
                <ContactForm
                  idPrefix={`development-contact-${group.developmentId}`}
                  defaultMessage={`Hola, quiero información sobre el emprendimiento ${group.developmentName}.`}
                />
              </div>
              <a
                href={buildWhatsAppUrl({ type: "development", name: group.developmentName, url })}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-centa-success)] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0.5"
              >
                <MessageCircle className="size-4" />
                Escribinos por WhatsApp
              </a>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
