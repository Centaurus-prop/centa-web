"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bath, BedDouble, Maximize, Mail, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/components/atoms/price-display";
import { ContactForm } from "@/components/molecules/contact-form";
import { accentGlowClassName, successGlowClassName } from "@/lib/theme";
import { buildWhatsAppUrl, SITE_URL } from "@/lib/whatsapp";
import type { Property } from "@/types/property";

interface PropertyContactCardProps {
  property: Property;
}

export function PropertyContactCard({ property }: PropertyContactCardProps) {
  const [showForm, setShowForm] = useState(false);
  const pathname = usePathname();
  const url = `${SITE_URL}${pathname}`;

  return (
    <div className="sticky top-24 space-y-4">
      <div className="surface-panel p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-centa-green-1">
              {formatPrice(property.precio, property.moneda)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{property.ubicacion}</p>
          </div>
          <span className="pill-label">
            {property.kind === "development" ? "Emprendimiento" : "Propiedad"}
          </span>
        </div>

        {property.expensas ? (
          <p className="mt-3 rounded-lg bg-centa-off-white px-3 py-2 text-sm text-centa-black">
            Expensas estimadas: <span className="font-semibold">{property.moneda === "USD" ? "USD " : "$ "}{property.expensas.toLocaleString("es-AR")}</span>
          </p>
        ) : null}

        <Separator className="my-4" />

        <div className="mb-6 flex justify-between text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <Maximize className="size-5 text-centa-green-1" />
            <span className="font-semibold text-centa-black">{property.m2} m²</span>
            <span className="text-xs">Superficie</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <BedDouble className="size-5 text-centa-green-1" />
            <span className="font-semibold text-centa-black">{property.ambientes}</span>
            <span className="text-xs">Ambientes</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Bath className="size-5 text-centa-green-1" />
            <span className="font-semibold text-centa-black">{property.banos}</span>
            <span className="text-xs">Baños</span>
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {property.kind === "development"
            ? "Pedinos disponibilidad, tipologías y forma de pago actualizada."
            : "Pedinos disponibilidad, visita y condiciones actualizadas de esta publicación."}
        </p>

        {showForm ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-centa-black">Enviar consulta</p>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Cerrar formulario"
                className="text-muted-foreground hover:text-centa-green-1 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <ContactForm
              propertyId={property.id}
              defaultMessage={`Hola, me interesa la propiedad "${property.titulo}".`}
            />
          </div>
        ) : (
          <Button
            onClick={() => setShowForm(true)}
            className={`h-12 w-full text-base font-bold text-white !bg-centa-green-1 hover:!bg-centa-green-1/90 ${accentGlowClassName} active:translate-y-px active:shadow-sm`}
          >
            <Mail className="mr-2 size-4" />
            {property.kind === "development" ? "Consultar este emprendimiento" : "Consultar esta propiedad"}
          </Button>
        )}

      </div>

      <div className="surface-panel p-4">
        <p className="text-sm font-semibold text-centa-black">¿Preferís hablar por WhatsApp?</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Escribinos y te respondemos con disponibilidad, valores y próximos pasos sin vueltas.
        </p>
        <Link
          href={buildWhatsAppUrl({ type: "property", name: property.titulo, url })}
          target="_blank"
          rel="noreferrer"
          className={`mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-centa-success)] px-4 text-sm font-semibold text-[var(--color-centa-success-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--color-centa-success)_90%,var(--color-centa-off-white))] ${successGlowClassName}`}
        >
          <MessageCircle className="size-4" />
          Hablar por WhatsApp
        </Link>
      </div>
    </div>
  );
}
