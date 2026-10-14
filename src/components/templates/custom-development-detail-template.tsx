"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/molecules/contact-form";
import { InteractiveImageGallery } from "@/components/organisms/interactive-image-gallery";
import { buildWhatsAppUrl, SITE_URL } from "@/lib/whatsapp";
import type { DevelopmentDetail } from "@/lib/developments";

interface CustomDevelopmentDetailTemplateProps {
  development: DevelopmentDetail;
}

export function CustomDevelopmentDetailTemplate({ development }: CustomDevelopmentDetailTemplateProps) {
  const pathname = usePathname();
  const url = `${SITE_URL}${pathname}`;

  const images = (development.resolvedImages.length > 0
    ? development.resolvedImages
    : ["/placeholder-property.svg"])
    .map((photo, index) => ({
      src: photo,
      alt: `${development.name} ${index + 1}`,
    }));
  const description = development.description?.trim() || "Próximamente más información sobre este emprendimiento.";
  const location = development.location || development.address || development.city;

  return (
    <div className="bg-centa-off-white py-10 sm:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <nav className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-centa-green-1">Inicio</Link></li>
            <li>/</li>
            <li><Link href="/emprendimientos" className="hover:text-centa-green-1">Emprendimientos</Link></li>
            <li>/</li>
            <li className="text-centa-black">{development.name}</li>
          </ol>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_440px]">
          <div className="space-y-8">
            <InteractiveImageGallery
              images={images}
              priority
              imageSizes="(max-width: 1024px) 100vw, 70vw"
              className="space-y-4"
              imageAltPrefix={development.name}
              showThumbnails={false}
            />

            <section className="space-y-5">
              <div>
                <p className="section-eyebrow">Tipologías</p>
                <h2 className="section-title">Unidades disponibles</h2>
              </div>

              <div className="surface-panel flex flex-col items-start gap-4 p-6 sm:p-7">
                <span className="pill-label gap-2">
                  <Clock3 className="size-3.5" />
                  Próximamente
                </span>
                <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                  Estamos finalizando las tipologías, valores y disponibilidad de este emprendimiento.
                  Dejanos tu consulta y te compartimos los detalles apenas estén disponibles.
                </p>
                <a
                  href="#contacto"
                  className="inline-flex items-center justify-center rounded-full bg-centa-green-1 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-centa-green-2"
                >
                  Consultar
                </a>
              </div>
            </section>

            <section className="surface-panel p-6 sm:p-7">
              <h2 className="section-title text-2xl sm:text-3xl">Descripción</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
            </section>

            {development.amenities.length > 0 ? (
              <section className="surface-panel p-6 sm:p-7">
                <h2 className="section-title text-2xl sm:text-3xl">Amenities</h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  {development.amenities.map((amenity) => (
                    <span key={amenity} className="pill-label border-primary/15 bg-primary/8 text-centa-green-1">
                      {amenity}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="surface-panel p-6 sm:p-7">
              <h2 className="section-title text-2xl sm:text-3xl">Ubicación</h2>
              <p className="mt-4 text-sm text-muted-foreground">{development.address ?? location ?? "Buenos Aires"}</p>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
            <div className="surface-panel p-6 sm:p-7">
              <div className="space-y-4">
                <span className="pill-label gap-2">
                  <Clock3 className="size-3.5" />
                  Próximamente
                </span>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-centa-black sm:text-4xl">{development.name}</h1>
                  <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-centa-green-1" />
                    <div>
                      <p>{location}</p>
                      {development.address && development.address !== location ? <p>{development.address}</p> : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-centa-off-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Entrega estimada</p>
                    <p className="mt-2 text-lg font-bold text-centa-black">{development.constructionDate || "Consultar"}</p>
                  </div>
                  <div className="rounded-2xl bg-centa-off-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Precio desde</p>
                    <p className="mt-2 text-lg font-bold text-centa-green-1">{development.price ? `${development.currency} ${development.price}` : "Consultar"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="contacto" className="surface-panel scroll-mt-24 p-5 sm:p-6">
              <p className="section-eyebrow">Contacto</p>
              <h2 className="section-title text-xl sm:text-2xl">Consultá este emprendimiento</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Te compartimos novedades, disponibilidad y próximos pasos de comercialización.
              </p>
              <div className="mt-4">
                <ContactForm
                  idPrefix={`custom-development-contact-${development.id}`}
                  defaultMessage={`Hola, quiero información sobre el emprendimiento ${development.name}.`}
                />
              </div>
              <a
                href={buildWhatsAppUrl({ type: "development", name: development.name, url })}
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
