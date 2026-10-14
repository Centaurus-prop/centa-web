"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface GooglePropertyMapProps {
  apiKey: string;
  lat: number;
  lng: number;
  title: string;
  fallbackMapUrl: string;
  fallbackLinkUrl: string;
}

interface GoogleLatLng {
  lat: number;
  lng: number;
}

interface GoogleMapOptions {
  center: GoogleLatLng;
  zoom: number;
  zoomControl: boolean;
  mapTypeControl: boolean;
  streetViewControl: boolean;
  fullscreenControl: boolean;
  styles: GoogleMapStyle[];
}

interface GoogleMapStyle {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number | boolean>>;
}

interface GoogleMapsApi {
  maps: {
    Map: new (element: HTMLElement, options: GoogleMapOptions) => unknown;
    Marker: new (options: {
      position: GoogleLatLng;
      map: unknown;
      title: string;
      icon: {
        path: string;
        fillColor: string;
        fillOpacity: number;
        strokeColor: string;
        strokeWeight: number;
        scale: number;
        anchor: { x: number; y: number };
      };
    }) => unknown;
    Point: new (x: number, y: number) => unknown;
    SymbolPath: { CIRCLE: number };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsApi;
    __centaGoogleMapsPromise?: Promise<void>;
    __centaGoogleMapsReady?: () => void;
  }
}

// Google invokes this once the API is fully initialized. With loading=async the
// script's `load` event fires BEFORE google.maps.Map exists, so we must wait for
// this callback instead of the load event (otherwise `new google.maps.Map` throws).
const READY_CALLBACK = "__centaGoogleMapsReady";

const CENTA_MAP_STYLES: GoogleMapStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f7f2" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#34463b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f7faf5" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9d5c9" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#eef5e8" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dceccb" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#d7dfd5" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f7f9f4" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#d5e7bd" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfdedb" }] },
];

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (window.__centaGoogleMapsPromise) return window.__centaGoogleMapsPromise;

  window.__centaGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    // Resolve only when Map is actually constructible, not merely when the tag loads.
    window[READY_CALLBACK] = () => resolve();

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-centa-google-maps="true"]',
    );

    if (existingScript) {
      if (existingScript.dataset.failed === "true") {
        existingScript.remove();
      } else if (window.google?.maps?.Map) {
        // Script already loaded and maps API ready
        resolve();
        return;
      } else {
        // Script is in flight; the callback above will fire when it's ready.
        existingScript.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps")), {
          once: true,
        });
        return;
      }
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&callback=${READY_CALLBACK}`;
    script.async = true;
    script.defer = true;
    script.dataset.centaGoogleMaps = "true";
    script.addEventListener(
      "error",
      () => {
        script.dataset.failed = "true";
        script.remove();
        reject(new Error("No se pudo cargar Google Maps"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  window.__centaGoogleMapsPromise = window.__centaGoogleMapsPromise.catch((error: unknown) => {
    window.__centaGoogleMapsPromise = undefined;
    throw error;
  });

  return window.__centaGoogleMapsPromise;
}

export function GooglePropertyMap({
  apiKey,
  lat,
  lng,
  title,
  fallbackMapUrl,
  fallbackLinkUrl,
}: GooglePropertyMapProps) {
  const mapId = useId();
  const mapRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!isMounted || !mapRef.current) return;
        if (!window.google?.maps?.Map) throw new Error("Google Maps no disponible");

        const position = { lat, lng };
        const map = new window.google.maps.Map(mapRef.current, {
          center: position,
          zoom: 15,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: CENTA_MAP_STYLES,
        });

        // Custom pin marker in Centa brand colors
        new window.google.maps.Marker({
          position,
          map,
          title,
          icon: {
            // SVG path for a Google-maps-style teardrop pin
            path: "M12 0C7.58 0 4 3.58 4 8c0 6 8 16 8 16s8-10 8-16c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
            fillColor: "#003A2A",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1.5,
            scale: 2,
            anchor: { x: 24, y: 48 },

          },
        });
        setIsLoaded(true);
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey, lat, lng, title]);

  if (hasError) {
    return (
      <>
        <iframe
          title={`Mapa de ${title}`}
          src={fallbackMapUrl}
          className="aspect-[16/7] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          href={fallbackLinkUrl}
          target="_blank"
          rel="noreferrer"
          className="block bg-white px-4 py-2 text-sm font-medium text-centa-green-1 transition hover:bg-centa-off-white"
        >
          Ver mapa ampliado
        </a>
      </>
    );
  }

  return (
    <div className="relative aspect-[16/7] w-full">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-centa-green-1/5">
          <div className="text-center text-centa-black/60">
            <MapPin className="size-8 mx-auto mb-2 text-centa-green-1/40" aria-hidden="true" />
            <p className="text-sm">Cargando mapa...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} id={mapId} className="h-full w-full" aria-label={`Mapa de ${title}`} />
    </div>
  );
}
