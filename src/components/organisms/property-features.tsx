"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { categoryLabels, statusLabels } from "@/components/atoms/category-badge";
import { GooglePropertyMap } from "@/components/molecules/google-property-map";
import type { Property } from "@/types/property";

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

interface PropertyFeaturesProps {
  property: Property;
}

function formatFeatureValue(value: number | null | undefined, suffix = "") {
  if (!value || value <= 0) return "Consultar";
  return `${value.toLocaleString("es-AR")}${suffix}`;
}

export function PropertyFeatures({ property }: PropertyFeaturesProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const coordinates = property.coordenadas;
  const mapUrl = coordinates
    ? buildMapUrl(coordinates.lat, coordinates.lng)
    : null;
  const openStreetMapUrl = coordinates
    ? buildOpenStreetMapUrl(coordinates.lat, coordinates.lng)
    : null;
  const googleMapsUrl = coordinates
    ? buildGoogleMapsUrl(coordinates.lat, coordinates.lng)
    : null;

  // Prevent flash: only decide Google vs OSM after client hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const useGoogleMaps = mounted && coordinates && mapUrl && openStreetMapUrl && googleMapsUrl && googleMapsApiKey;

  const features: Array<{ label: string; value: string }> = [
    { label: "Operación", value: property.operacion ?? "Consultar" },
    { label: "Tipo", value: property.tipo ?? "Consultar" },
    { label: "Superficie cubierta", value: formatFeatureValue(property.superficieCubierta, " m²") },
    { label: "Superficie total", value: formatFeatureValue(property.superficieTotal ?? property.m2, " m²") },
    { label: "Ambientes", value: formatFeatureValue(property.ambientes) },
    { label: "Dormitorios", value: formatFeatureValue(property.dormitorios) },
    { label: "Baños", value: formatFeatureValue(property.banos) },
    { label: "Estado", value: statusLabels[property.estado] },
    { label: "Categoría", value: categoryLabels[property.categoria] },
    { label: "Moneda", value: property.moneda },
    { label: "Barrio", value: property.barrio || "Consultar" },
    { label: "Dirección", value: property.direccion ?? property.ubicacion },
    {
      label: "Expensas",
      value: property.expensas ? `${property.moneda === "USD" ? "USD " : "$ "}${property.expensas.toLocaleString("es-AR")}` : "Consultar",
    },
    {
      label: "Antigüedad",
      value: property.antiguedad === null || property.antiguedad === undefined ? "Consultar" : `${property.antiguedad} años`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-centa-black mb-4">Descripción</h2>
        <p className="text-muted-foreground leading-relaxed">{property.descripcion}</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-centa-black mb-4">Características</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {features.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {label}
              </span>
              <span className="font-semibold text-centa-black">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-centa-black mb-4">Ubicación</h2>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="size-4 text-centa-green-1" />
          <span>{property.ubicacion}</span>
        </div>
        {useGoogleMaps ? (
          <div className="overflow-hidden rounded-lg border border-centa-green-1/15 shadow-sm">
            <GooglePropertyMap
              apiKey={googleMapsApiKey}
              lat={coordinates.lat}
              lng={coordinates.lng}
              title={property.titulo}
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
          </div>
        ) : mapUrl ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <iframe
              title={`Mapa de ${property.titulo}`}
              src={mapUrl}
              className="aspect-[16/7] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href={openStreetMapUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="block bg-white px-4 py-2 text-sm font-medium text-centa-green-1 transition hover:bg-centa-off-white"
            >
              Ver mapa ampliado
            </a>
          </div>
        ) : (
          <div className="aspect-[16/7] rounded-lg bg-gray-100 flex items-center justify-center border border-dashed border-gray-300">
            <div className="text-center text-muted-foreground">
              <MapPin className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Mapa no disponible para esta propiedad</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
