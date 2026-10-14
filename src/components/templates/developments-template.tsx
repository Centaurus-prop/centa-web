"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { ContactForm } from "@/components/molecules/contact-form";
import { DevelopmentGroupCard } from "@/components/molecules/development-group-card";
import type { Development } from "@/lib/developments";
import type { DevelopmentGroup } from "@/lib/properties";
import { primaryGlowClassName } from "@/lib/theme";

interface DevelopmentsTemplateProps {
  disponibles: DevelopmentGroup[];
  proximamente: Development[];
}

function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  contactForm,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  contactForm?: React.ReactNode;
}) {
  return (
    <div className="surface-panel rounded-2xl border-dashed border-primary/20 p-8 text-center">
      <h3 className="text-xl font-semibold text-centa-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      {contactForm ? (
        <div className="mx-auto mt-6 max-w-2xl text-left">{contactForm}</div>
      ) : ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className={`mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/92 active:translate-y-px ${primaryGlowClassName}`}
        >
          {ctaLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

function UpcomingDevelopmentCard({ development }: { development: Development }) {
  const title = development.name;
  const location = development.location || development.address || development.city;
  const description = development.description?.trim() || "Consultanos para conocer más sobre este próximo emprendimiento.";
  const heroImage = development.coverImage || development.images.find(Boolean) || "/placeholder-property.svg";
  const detailHref = `/emprendimiento/${encodeURIComponent(development.slug)}`;

  return (
    <Link
      href={detailHref}
      className="group relative block overflow-hidden rounded-[28px] border border-centa-green-1/10 bg-white shadow-[0_20px_60px_-45px_rgba(16,78,64,0.4)] transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-centa-off-white">
        <Image
          src={heroImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          unoptimized
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-6 pb-6 pt-14 transition-opacity duration-300 ease-out group-hover:opacity-0">
          <div className="pill-label w-fit gap-2 border-white/10 bg-white/15 text-white/90">
            <Clock3 className="size-3.5" />
            Próximamente
          </div>
          <h3 className="mt-3 text-2xl font-bold text-white">{title}</h3>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-6 text-white opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
          <div className="space-y-3">
            <div className="pill-label w-fit gap-2 border-white/10 bg-white/15 text-white/90">
              <Clock3 className="size-3.5" />
              Próximamente
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{title}</h3>
              <p className="text-sm text-white/80">{location}</p>
              {development.constructionDate ? (
                <p className="text-sm text-white/70">Entrega estimada: {development.constructionDate}</p>
              ) : null}
            </div>
            <p className="line-clamp-2 text-sm leading-6 text-white/85">{description}</p>
          </div>

          <div className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-centa-green-1 px-5 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-centa-green-1/90">
            Ver detalle
            <ArrowRight className="size-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function DevelopmentsTemplate({ disponibles, proximamente }: DevelopmentsTemplateProps) {
  return (
    <div className="bg-centa-off-white py-10 sm:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 sm:px-6 lg:px-8">
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="section-eyebrow">Propiedades</p>
            <h1 className="section-title">Emprendimientos</h1>
          </div>

          {disponibles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {disponibles.map((group) => (
                <DevelopmentGroupCard key={group.developmentId} group={group} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No hay emprendimientos disponibles cargados todavía"
              description="Mientras terminamos la integración completa, podés explorar el catálogo general o dejarnos una consulta para recibir novedades."
              ctaLabel="Explorar catálogo"
              ctaHref="/catalogo"
            />
          )}
        </section>

        <section className="space-y-6 border-t border-centa-green-1/10 pt-12">
          <div className="space-y-3">
            <div className="pill-label gap-2 tracking-wider">
              <Clock3 className="size-3.5" />
              Próximamente
            </div>
            <div>
              <h2 className="text-2xl font-bold text-centa-black sm:text-3xl">Próximos emprendimientos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Desarrollos en preparación para próximos lanzamientos comerciales.
              </p>
            </div>
          </div>

          {proximamente.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {proximamente.map((development) => (
                <UpcomingDevelopmentCard key={development.id} development={development} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Estamos preparando los próximos emprendimientos"
              description="Todavía no hay desarrollos locales marcados como próximos. Dejanos tus datos y te avisamos apenas publiquemos nuevas oportunidades."
              contactForm={
                <ContactForm
                  idPrefix="developments-updates"
                  defaultMessage="Hola, quiero recibir novedades sobre próximos emprendimientos."
                />
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
