import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { mockProperties } from "@/data/mock-properties";
import { db } from "@/lib/db";
import { properties, propertyImages, type PropertyImageRecord, type PropertyRecord } from "@/db/schema";
import type {
  DevelopmentStage,
  Property,
  PropertyCoordinates,
  PropertyDevelopmentData,
  PropertyImage,
  PropertyKind,
  PropertySource,
  PublishStatus,
} from "@/types/property";

const TOKKO_BASE_URL = "https://www.tokkobroker.com/api/v1";
const TOKKO_REVALIDATE_SECONDS = 300;

interface TokkoApiResponse {
  objects?: unknown[];
  results?: unknown[];
}

interface TokkoPhoto {
  image?: string;
  big?: string;
  medium?: string;
  thumb?: string;
  is_front_cover?: boolean;
  description?: string;
}

interface TokkoLocation {
  name?: string;
  full_location?: string;
  geo_lat?: number | string;
  geo_long?: number | string;
  latitude?: number | string;
  longitude?: number | string;
}

interface TokkoAddress {
  street?: string;
  number?: string;
  location?: TokkoLocation;
  geo_lat?: number | string;
  geo_long?: number | string;
  latitude?: number | string;
  longitude?: number | string;
}

interface TokkoCurrency {
  code?: string;
}

interface TokkoOperationPrice {
  price?: number | string;
  currency?: string | TokkoCurrency;
}

interface TokkoOperation {
  prices?: TokkoOperationPrice[];
  type?: { name?: string };
  operation_type?: string;
}

interface TokkoProperty {
  id?: number | string;
  public_id?: string;
  publication_title?: string;
  description?: string;
  price?: number | string;
  currency?: string | TokkoCurrency;
  roofed_surface?: number | string;
  total_surface?: number | string;
  surface?: number | string;
  room_amount?: number | string;
  suite_amount?: number | string;
  bathroom_amount?: number | string;
  expenses?: number | string;
  location?: TokkoLocation;
  address?: TokkoAddress;
  geo_lat?: number | string;
  geo_long?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  city?: string;
  type?: { name?: string };
  operations?: TokkoOperation[];
  photos?: TokkoPhoto[];
  is_starred_on_web?: boolean;
  featured?: boolean;
  situation?: string;
  age?: number | string;
  development_status?: string;
  stage?: string;
  tags?: Array<{ name?: string }>;
  development?: {
    id: number;
    name: string;
    description?: string;
    address?: string;
    fake_address?: string;
    photos?: Array<{ image: string; is_front_cover?: boolean; description?: string }>;
    construction_date?: string;
    construction_status?: number;
    tags?: Array<{ name: string }>;
    location?: { full_location?: string; name?: string };
    geo_lat?: string;
    geo_long?: string;
  };
}

export interface PropertyFilters {
  source?: Exclude<PropertySource, "mock"> | "todos";
  kind?: PropertyKind | "todos";
  publishStatus?: PublishStatus | "todos";
  developmentStage?: DevelopmentStage | "todos";
  publishedOnly?: boolean;
}

export interface DashboardPropertySummary {
  total: number;
  available: number;
  featured: number;
  sourceBreakdown: Record<string, number>;
}

export interface CreateLocalPropertyInput {
  titulo: string;
  descripcion: string;
  precio: number;
  moneda: Property["moneda"];
  m2: number;
  ambientes: number;
  banos: number;
  ubicacion: string;
  barrio: string;
  ciudad: string;
  categoria: Property["categoria"];
  estado: Property["estado"];
  destacada: boolean;
  kind: PropertyKind;
  publishStatus: PublishStatus;
  developmentStage: DevelopmentStage;
  developmentName?: string;
  slug?: string;
  imageUrls?: string[];
  developmentAddress?: string;
  developmentConstructionDate?: string;
  developmentAmenities?: string[];
  createdBy?: string;
}

export interface DevelopmentGroup {
  developmentId: string;
  developmentName: string;
  description?: string;
  photos: string[];
  address?: string;
  location?: string;
  constructionDate?: string;
  amenities: string[];
  coordinates?: { lat: number; lng: number };
  units: {
    ambientes: number;
    label: string;
    properties: Property[];
  }[];
}

function getTokkoApiKey() {
  return process.env.TOKKO_API_KEY?.trim() ?? "";
}

function normalizeNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeCurrency(value: unknown): "ARS" | "USD" {
  if (typeof value === "string") return value.toUpperCase().includes("ARS") ? "ARS" : "USD";
  if (value && typeof value === "object" && "code" in value) {
    const code = String((value as TokkoCurrency).code ?? "USD").toUpperCase();
    return code.includes("ARS") ? "ARS" : "USD";
  }
  return "USD";
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isMeaningfulText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized !== "" && normalized !== "---" && normalized !== "n/a" && normalized !== "null";
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return numeric;
}

function getAmbientesLabel(ambientes: number) {
  if (ambientes <= 0) return "Monoambiente";
  if (ambientes === 1) return "1 Ambiente";
  return `${ambientes} Ambientes`;
}

function mapCategory(property: TokkoProperty): Property["categoria"] {
  if (property.development?.id) return "emprendimiento";

  const typeName = String(property.type?.name ?? "").toLowerCase();
  const title = String(property.publication_title ?? "").toLowerCase();
  const description = String(property.description ?? "").toLowerCase();
  const situation = String(property.situation ?? "").toLowerCase();
  const developmentStatus = String(property.development_status ?? property.stage ?? "").toLowerCase();
  const tagNames = (property.tags ?? []).map((tag) => String(tag.name ?? "").toLowerCase());
  const developmentSignals = [typeName, title, description, situation, developmentStatus, ...tagNames].join(" ");

  if (
    developmentSignals.includes("emprend") ||
    developmentSignals.includes("desarrollo") ||
    developmentSignals.includes("pozo") ||
    developmentSignals.includes("lanzamiento") ||
    developmentSignals.includes("obra")
  ) {
    return "emprendimiento";
  }

  if (normalizeNumber(property.age, 1) === 0) return "a-estrenar";
  if (title.includes("estrenar") || typeName.includes("pozo")) return "a-estrenar";
  return "usado";
}

function mapStatus(situation: unknown): Property["estado"] {
  const normalized = normalizeText(situation);
  if (normalized.includes("reserv")) return "reservado";
  if (normalized.includes("vend")) return "vendido";
  return "disponible";
}

function buildLocation(property: TokkoProperty) {
  const locationName = property.location?.name ?? property.address?.location?.name ?? property.development?.location?.name ?? "";
  const city = String(property.city ?? "Buenos Aires").trim() || "Buenos Aires";
  const ubicacion = [locationName, city].filter(Boolean).join(", ");

  return {
    barrio: String(locationName || city || "Buenos Aires"),
    ciudad: city,
    ubicacion: ubicacion || city,
  };
}

function getTokkoCoordinates(property: TokkoProperty): PropertyCoordinates | undefined {
  const lat = normalizeNumber(
    property.geo_lat ??
      property.latitude ??
      property.address?.geo_lat ??
      property.address?.latitude ??
      property.location?.geo_lat ??
      property.location?.latitude ??
      property.address?.location?.geo_lat ??
      property.address?.location?.latitude ??
      property.development?.geo_lat,
    Number.NaN,
  );
  const lng = normalizeNumber(
    property.geo_long ??
      property.longitude ??
      property.address?.geo_long ??
      property.address?.longitude ??
      property.location?.geo_long ??
      property.location?.longitude ??
      property.address?.location?.geo_long ??
      property.address?.location?.longitude ??
      property.development?.geo_long,
    Number.NaN,
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;

  return { lat, lng };
}

function mapImages(photos: TokkoPhoto[] | undefined, title: string): PropertyImage[] {
  return (photos ?? []).reduce<PropertyImage[]>((items, photo, index) => {
    const url = photo.image ?? photo.big ?? photo.medium ?? photo.thumb;
    if (!url) return items;

    items.push({
      url,
      alt: `${title} - foto ${index + 1}`,
      orden: index,
      isMain: index === 0,
    });
    return items;
  }, []);
}

function getOperationPrice(property: TokkoProperty) {
  const firstOperation = property.operations?.[0];
  const operationType = firstOperation?.type?.name ?? firstOperation?.operation_type ?? undefined;

  for (const operation of property.operations ?? []) {
    for (const price of operation.prices ?? []) {
      const amount = normalizeNumber(price.price);
      if (amount > 0) {
        return {
          precio: amount,
          moneda: normalizeCurrency(price.currency),
          operacion: operation.type?.name ?? operation.operation_type ?? operationType,
        };
      }
    }
  }

  return {
    precio: normalizeNumber(property.price),
    moneda: normalizeCurrency(property.currency),
    operacion: operationType,
  };
}

function inferTokkoDevelopmentStage(property: TokkoProperty): DevelopmentStage {
  const haystack = normalizeText(
    [
      property.publication_title,
      property.description,
      property.situation,
      property.development_status,
      property.stage,
      ...(property.tags ?? []).map((tag) => tag.name),
      property.development?.construction_status,
    ]
      .map((value) => String(value ?? ""))
      .join(" "),
  );

  if (haystack.includes("entregado") || haystack.includes("terminado")) return "delivered";
  // Match real "coming soon" signals only. The previous "proxim" substring also matched
  // innocuous prose like "aproximadamente" / "proximidad" in free-text descriptions,
  // mislabeling available units as upcoming and dropping them from their development (TEN-183).
  if (haystack.includes("proximamente") || haystack.includes("lanzamiento") || haystack.includes("pozo")) {
    return "upcoming";
  }
  if (haystack.includes("obra") || haystack.includes("constru") || property.development?.id) return "active";
  return mapCategory(property) === "emprendimiento" ? "active" : "none";
}

function mapDevelopmentData(raw: TokkoProperty): { developmentId?: string; developmentName?: string; developmentData?: PropertyDevelopmentData } {
  const development = raw.development;
  if (!development?.id || !isMeaningfulText(development.name)) {
    return {};
  }

  const photos = [...(development.photos ?? [])]
    .sort((a, b) => Number(Boolean(b.is_front_cover)) - Number(Boolean(a.is_front_cover)))
    .map((photo) => photo.image)
    .filter(Boolean);

  const lat = normalizeOptionalNumber(development.geo_lat);
  const lng = normalizeOptionalNumber(development.geo_long);

  return {
    developmentId: `tokko-${development.id}`,
    developmentName: String(development.name).trim(),
    developmentData: {
      description: isMeaningfulText(development.description) ? String(development.description).trim() : undefined,
      photos,
      address: isMeaningfulText(development.fake_address ?? development.address)
        ? String(development.fake_address ?? development.address).trim()
        : undefined,
      constructionDate: isMeaningfulText(development.construction_date)
        ? String(development.construction_date).trim()
        : undefined,
      amenities: (development.tags ?? []).map((tag) => tag.name).filter((tag): tag is string => isMeaningfulText(tag)).map((tag) => tag.trim()),
      location: isMeaningfulText(development.location?.name) ? String(development.location?.name).trim() : undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
    },
  };
}

function mapTokkoProperty(raw: TokkoProperty): Property | null {
  const id = String(raw.public_id ?? raw.id ?? "").trim();
  if (!id) return null;

  const title = String(raw.publication_title ?? "Propiedad").trim();
  const { precio, moneda, operacion } = getOperationPrice(raw);
  const images = mapImages(raw.photos, title);
  const { barrio, ciudad, ubicacion } = buildLocation(raw);
  const coordenadas = getTokkoCoordinates(raw);
  const categoria = mapCategory(raw);
  const hasDevelopmentObject = Boolean(raw.development?.id);
  const isDevelopment = hasDevelopmentObject || categoria === "emprendimiento";
  const developmentStage = isDevelopment ? inferTokkoDevelopmentStage(raw) : "none";
  const superficieCubierta = normalizeOptionalNumber(raw.roofed_surface);
  const superficieTotal = normalizeOptionalNumber(raw.total_surface ?? raw.surface);
  const dormitorios = normalizeOptionalNumber(raw.suite_amount);
  const expensas = normalizeOptionalNumber(raw.expenses);
  const antiguedad = Number(raw.age);
  const direccion = [String(raw.address ?? "").trim(), barrio !== ciudad ? ciudad : ""].filter(Boolean).join(", ");
  const { developmentId, developmentName, developmentData } = mapDevelopmentData(raw);

  return {
    id,
    titulo: title,
    descripcion: String(raw.description ?? "Sin descripción disponible.").trim() || "Sin descripción disponible.",
    precio,
    moneda,
    m2: superficieTotal ?? superficieCubierta ?? 0,
    ambientes: normalizeNumber(raw.room_amount, 0),
    banos: normalizeNumber(raw.bathroom_amount, 0),
    ubicacion,
    barrio,
    ciudad,
    coordenadas,
    categoria,
    imagenUrl:
      images.find((image) => image.isMain)?.url ??
      images[0]?.url ??
      developmentData?.photos[0] ??
      "/placeholder-property.svg",
    imagenes: images,
    destacada: Boolean(raw.is_starred_on_web ?? raw.featured),
    estado: mapStatus(raw.situation),
    operacion: isMeaningfulText(operacion) ? operacion : undefined,
    tipo: isMeaningfulText(raw.type?.name) ? String(raw.type?.name).trim() : undefined,
    direccion: isMeaningfulText(direccion) ? direccion : undefined,
    superficieCubierta,
    superficieTotal,
    dormitorios,
    expensas,
    antiguedad: Number.isFinite(antiguedad) && antiguedad >= 0 ? antiguedad : null,
    fuente: "tokko",
    kind: isDevelopment ? "development" : "property",
    publishStatus: "published",
    developmentStage,
    developmentId,
    developmentName,
    developmentData,
  };
}

function getItemsFromResponse(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const typed = payload as TokkoApiResponse;
    if (Array.isArray(typed.objects)) return typed.objects;
    if (Array.isArray(typed.results)) return typed.results;
  }
  return [];
}

async function fetchTokkoProperties() {
  const apiKey = getTokkoApiKey();
  if (!apiKey) return null;

  const endpoints = [
    `${TOKKO_BASE_URL}/property/?format=json&lang=es_ar&limit=200&key=${apiKey}`,
    `${TOKKO_BASE_URL}/property/search/?format=json&lang=es_ar&limit=200&key=${apiKey}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        next: { revalidate: TOKKO_REVALIDATE_SECONDS },
      });

      if (!response.ok) continue;

      const payload = (await response.json()) as unknown;
      const items = getItemsFromResponse(payload)
        .map((item) => mapTokkoProperty(item as TokkoProperty))
        .filter((item): item is Property => item !== null);

      if (items.length > 0) return items;
    } catch {
      continue;
    }
  }

  return null;
}

function sortImages(images: PropertyImage[]) {
  return [...images].sort((a, b) => {
    const mainDelta = Number(b.isMain ?? false) - Number(a.isMain ?? false);
    if (mainDelta !== 0) return mainDelta;
    return (a.orden ?? 0) - (b.orden ?? 0);
  });
}

function parseDevelopmentData(value: string | null): PropertyDevelopmentData | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as PropertyDevelopmentData;
    return {
      description: parsed.description,
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
      address: parsed.address,
      constructionDate: parsed.constructionDate,
      amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [],
      location: parsed.location,
      lat: typeof parsed.lat === "number" ? parsed.lat : undefined,
      lng: typeof parsed.lng === "number" ? parsed.lng : undefined,
    };
  } catch {
    return undefined;
  }
}

function mapDbProperty(record: PropertyRecord, images: PropertyImageRecord[]): Property {
  const mappedImages = sortImages(
    images.map((image) => ({
      url: image.url,
      alt: image.alt ?? undefined,
      orden: image.orden,
      isMain: image.isMain,
    })),
  );

  const developmentData = parseDevelopmentData(record.developmentData ?? null);
  const fallbackImage = developmentData?.photos[0] ?? mappedImages[0]?.url ?? record.imagenUrl ?? "/placeholder-property.svg";
  const isDevelopment = record.kind === "development";

  return {
    id: record.id,
    titulo: record.titulo,
    descripcion: record.descripcion ?? "Sin descripción disponible.",
    createdAt: record.createdAt.toISOString(),
    precio: Number(record.precio ?? 0),
    moneda: record.moneda,
    m2: record.m2,
    ambientes: record.ambientes,
    banos: record.banos,
    ubicacion: record.ubicacion,
    barrio: record.barrio,
    ciudad: record.ciudad,
    categoria: isDevelopment ? "emprendimiento" : record.categoria,
    imagenUrl: fallbackImage,
    imagenes: mappedImages,
    destacada: record.destacada,
    estado: record.estado,
    direccion: developmentData?.address ?? record.ubicacion,
    superficieCubierta: record.m2 > 0 ? record.m2 : null,
    superficieTotal: record.m2 > 0 ? record.m2 : null,
    fuente: record.source,
    kind: record.kind,
    publishStatus: record.publishStatus,
    developmentStage: record.developmentStage,
    slug: record.slug,
    developmentId: record.developmentId ?? undefined,
    developmentName: record.developmentName ?? undefined,
    developmentData,
    coordenadas:
      typeof developmentData?.lat === "number" && typeof developmentData?.lng === "number"
        ? { lat: developmentData.lat, lng: developmentData.lng }
        : undefined,
  };
}

async function fetchLocalProperties(filters: PropertyFilters = {}) {
  try {
    const conditions = [];

    if (filters.publishedOnly) {
      conditions.push(eq(properties.publishStatus, "published"));
      conditions.push(eq(properties.publicado, true));
    }
    if (filters.source && filters.source !== "todos") conditions.push(eq(properties.source, filters.source));
    if (filters.kind && filters.kind !== "todos") conditions.push(eq(properties.kind, filters.kind));
    if (filters.publishStatus && filters.publishStatus !== "todos") {
      conditions.push(eq(properties.publishStatus, filters.publishStatus));
    }
    if (filters.developmentStage && filters.developmentStage !== "todos") {
      conditions.push(eq(properties.developmentStage, filters.developmentStage));
    }

    const records = await db.query.properties.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        propertyImages: {
          orderBy: [desc(propertyImages.isMain), asc(propertyImages.orden), asc(propertyImages.createdAt)],
        },
      },
      orderBy: [desc(properties.destacada), desc(properties.updatedAt)],
    });

    return records.map((record) => mapDbProperty(record, record.propertyImages));
  } catch {
    return [];
  }
}

async function findLocalPropertyByIdOrSlug(id: string): Promise<Property | null> {
  try {
    const record = await db.query.properties.findFirst({
      where: or(eq(properties.id, id), eq(properties.slug, id)),
      with: {
        propertyImages: {
          orderBy: [desc(propertyImages.isMain), asc(propertyImages.orden), asc(propertyImages.createdAt)],
        },
      },
    });
    return record ? mapDbProperty(record, record.propertyImages) : null;
  } catch {
    return null;
  }
}

function normalizeMockProperties(): Property[] {
  return mockProperties.map((property) => ({
    ...property,
    imagenes: [{ url: property.imagenUrl, alt: property.titulo, orden: 0, isMain: true }],
    fuente: "mock" as const,
    kind: property.categoria === "emprendimiento" ? "development" : "property",
    publishStatus: "published" as const,
    developmentStage: property.categoria === "emprendimiento" ? "active" : "none",
  }));
}

export async function getAllProperties(filters: PropertyFilters = {}) {
  const [tokkoProperties, localProperties, destacadaOverrides] = await Promise.all([
    fetchTokkoProperties(),
    fetchLocalProperties(filters.publishedOnly ? { ...filters, source: filters.source === "todos" ? undefined : filters.source } : filters),
    db
      .select({ tokkoId: properties.tokkoId, destacada: properties.destacada })
      .from(properties)
      .where(eq(properties.source, "tokko")),
  ]);

  const baseProperties = tokkoProperties && tokkoProperties.length > 0 ? tokkoProperties : normalizeMockProperties();
  const dbDestacadaMap = new Map<string, boolean>();
  for (const row of destacadaOverrides) {
    if (row.tokkoId !== null) {
      dbDestacadaMap.set(String(row.tokkoId), row.destacada);
    }
  }

  for (const property of baseProperties) {
    const destacadaOverride = dbDestacadaMap.get(property.id);
    if (destacadaOverride !== undefined) {
      property.destacada = destacadaOverride;
    }
  }

  const basePropertyIds = new Set(baseProperties.map((property) => property.id));
  const uniqueLocalProperties = localProperties.filter((property) => {
    if (basePropertyIds.has(property.id)) {
      return false;
    }
    return property.titulo.trim() !== "";
  });

  let merged = [...baseProperties, ...uniqueLocalProperties];

  if (filters.source && filters.source !== "todos") {
    merged = merged.filter((property) => property.fuente === filters.source);
  }
  if (filters.kind && filters.kind !== "todos") {
    merged = merged.filter((property) => (property.kind ?? "property") === filters.kind);
  }
  if (filters.publishStatus && filters.publishStatus !== "todos") {
    merged = merged.filter((property) => (property.publishStatus ?? "published") === filters.publishStatus);
  }
  if (filters.developmentStage && filters.developmentStage !== "todos") {
    merged = merged.filter((property) => (property.developmentStage ?? "none") === filters.developmentStage);
  }
  if (filters.publishedOnly) {
    merged = merged.filter((property) => (property.publishStatus ?? "published") === "published");
  }

  return merged;
}

export async function getFeaturedProperties() {
  const properties = await getAllProperties({ publishedOnly: true });
  const featured = properties.filter((property) => property.destacada);
  const source = featured.length > 0 ? featured : properties;
  return source.slice(0, 8);
}

export async function getFeaturedDevelopments() {
  const groups = await getDevelopmentGroups();
  return groups.flatMap((group) => group.units.flatMap((unit) => unit.properties)).slice(0, 8);
}

export async function getDevelopmentGroups(featuredOnly?: boolean): Promise<DevelopmentGroup[]> {
  const allProperties = await getAllProperties({ publishedOnly: true });
  const availableDevelopments = allProperties.filter((property) => {
    if ((property.kind ?? "property") !== "development") return false;
    // "Próximamente" routing applies only to local developments, which set this stage
    // explicitly and surface in the dedicated proximamente bucket. Tokko units derive
    // stage from a text heuristic, so dropping them per-unit fragments a single
    // development (TEN-183: Arenales rendered 2 of its 5 units). Always group Tokko units.
    if (property.fuente === "local" && (property.developmentStage ?? "none") === "upcoming") return false;
    return Boolean(property.developmentId) || property.categoria === "emprendimiento";
  });

  const grouped = new Map<string, Property[]>();

  for (const property of availableDevelopments) {
    const fallbackGroupKey = property.developmentName
      ? `name-${property.developmentName.trim().toLowerCase()}`
      : `fallback-${property.id}`;
    const key = property.developmentId ?? fallbackGroupKey;
    const current = grouped.get(key) ?? [];
    current.push(property);
    grouped.set(key, current);
  }

  const groups: DevelopmentGroup[] = Array.from(grouped.entries()).map(([key, items]) => {
    const reference = items[0];
    const amenities = Array.from(new Set(items.flatMap((item) => item.developmentData?.amenities ?? []))).filter(Boolean);
    const photos = reference.developmentData?.photos?.length
      ? reference.developmentData.photos
      : items.flatMap((item) => item.imagenes?.map((image) => image.url) ?? []);

    const unitMap = new Map<number, Property[]>();
    for (const item of items) {
      const ambientes = Math.max(0, Math.round(item.ambientes ?? 0));
      const bucket = unitMap.get(ambientes) ?? [];
      bucket.push(item);
      unitMap.set(ambientes, bucket);
    }

    const units = Array.from(unitMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ambientes, properties]) => ({
        ambientes,
        label: getAmbientesLabel(ambientes),
        properties: [...properties].sort((a, b) => a.precio - b.precio),
      }));

    const lat = reference.developmentData?.lat ?? reference.coordenadas?.lat;
    const lng = reference.developmentData?.lng ?? reference.coordenadas?.lng;

    return {
      developmentId: reference.developmentId ?? key,
      developmentName: reference.developmentName ?? reference.titulo,
      description: reference.developmentData?.description ?? reference.descripcion,
      photos,
      address: reference.developmentData?.address,
      location: reference.developmentData?.location ?? reference.barrio,
      constructionDate: reference.developmentData?.constructionDate,
      amenities,
      coordinates: typeof lat === "number" && typeof lng === "number" ? { lat, lng } : undefined,
      units,
    };
  });

  const sortedGroups = groups.sort((a, b) => {
    const countA = a.units.reduce((total, unit) => total + unit.properties.length, 0);
    const countB = b.units.reduce((total, unit) => total + unit.properties.length, 0);
    if (countB !== countA) return countB - countA;
    return a.developmentName.localeCompare(b.developmentName, "es");
  });

  if (featuredOnly) {
    return sortedGroups.filter((group) =>
      group.units.some((unit) => unit.properties.some((property) => property.destacada)),
    );
  }

  return sortedGroups;
}

export async function getDevelopmentGroupByName(name: string): Promise<DevelopmentGroup | null> {
  const groups = await getDevelopmentGroups();
  return groups.find((group) =>
    group.developmentName.trim().toLowerCase() === decodeURIComponent(name).trim().toLowerCase() ||
    group.developmentId === name ||
    group.developmentId === `tokko-${name}`,
  ) ?? null;
}

export async function getDevelopmentBuckets() {
  const properties = await getAllProperties({ publishedOnly: true });
  const developments = properties.filter((property) => (property.kind ?? "property") === "development");

  return {
    disponibles: await getDevelopmentGroups(),
    proximamente: developments.filter(
      (property) =>
        (property.developmentStage ?? "none") === "upcoming" &&
        property.fuente === "local" &&
        (property.kind ?? "property") === "development",
    ),
  };
}

export async function getPropertyById(id: string) {
  // Local DB is resolved directly so a shared link never depends on Tokko being up.
  const local = await findLocalPropertyByIdOrSlug(id);
  if (local) return local;

  // Resolve Tokko strictly from the real catalog. Crucially, do NOT route this
  // through getAllProperties()'s mock fallback: when fetchTokkoProperties() fails
  // transiently it returns the mock set, whose ids never match a real shared id,
  // producing a misleading 404 that the client reads as an auth wall (TEN-672).
  const tokkoProperties = await fetchTokkoProperties();
  if (tokkoProperties) {
    const match = tokkoProperties.find((property) => property.id === id || property.slug === id);
    if (match) return match;
  }

  // Mock data only stands in when Tokko is not configured (local dev), never in prod.
  if (!getTokkoApiKey()) {
    return normalizeMockProperties().find((property) => property.id === id || property.slug === id) ?? null;
  }

  return null;
}

export async function getRelatedProperties(property: Property) {
  const properties = await getAllProperties({ publishedOnly: true });
  const related = properties.filter(
    (candidate) => candidate.categoria === property.categoria && candidate.id !== property.id,
  );
  return related.slice(0, 3);
}

export async function getDashboardProperties(filters: PropertyFilters = {}) {
  const properties = await getAllProperties(filters);
  return properties.filter((property) => property.titulo.trim() !== "");
}

export async function getDashboardPropertySummary(propertiesList?: Property[]): Promise<DashboardPropertySummary> {
  const properties = propertiesList ?? await getAllProperties();
  return {
    total: properties.length,
    available: properties.filter((property) => property.estado === "disponible").length,
    featured: properties.filter((property) => property.destacada).length,
    sourceBreakdown: properties.reduce<Record<string, number>>((acc, property) => {
      const source = property.fuente ?? "desconocido";
      acc[source] = (acc[source] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(baseValue: string) {
  const baseSlug = slugify(baseValue) || `local-${Date.now()}`;
  try {
    const existing = await db
      .select({ slug: properties.slug })
      .from(properties)
      .where(sql`${properties.slug} like ${baseSlug + "%"}`);

    const slugs = new Set(existing.map((item) => item.slug).filter(Boolean));
    if (!slugs.has(baseSlug)) return baseSlug;

    let counter = 2;
    while (slugs.has(`${baseSlug}-${counter}`)) counter += 1;
    return `${baseSlug}-${counter}`;
  } catch {
    // If the slug check fails, generate a unique slug with timestamp
    return `${baseSlug}-${Date.now()}`;
  }
}

export interface UpdateLocalPropertyInput extends CreateLocalPropertyInput {
  id: string;
}

export async function createLocalProperty(input: CreateLocalPropertyInput) {
  const normalizedImageUrls = (input.imageUrls ?? []).map((url) => url.trim()).filter(Boolean);
  const slugBase = input.kind === "development" && input.developmentName?.trim()
    ? input.developmentName.trim()
    : input.slug?.trim() || input.titulo;
  const slug = await ensureUniqueSlug(slugBase);
  const now = new Date();
  const publishedAt: Date | null = input.publishStatus === "published" ? now : null;
  const archivedAt: Date | null = input.publishStatus === "archived" ? now : null;
  const normalizedDevelopmentName = input.kind === "development"
    ? (input.developmentName?.trim() || input.titulo.trim())
    : undefined;
  const developmentId = input.kind === "development" && input.developmentStage === "upcoming"
    ? `local-${slug}`
    : null;
  const developmentData = input.kind === "development"
    ? JSON.stringify({
        description: input.descripcion.trim(),
        photos: normalizedImageUrls,
        address: input.developmentAddress?.trim() || input.ubicacion.trim(),
        constructionDate: input.developmentConstructionDate?.trim() || undefined,
        amenities: (input.developmentAmenities ?? []).map((item) => item.trim()).filter(Boolean),
        location: input.barrio.trim(),
      } satisfies PropertyDevelopmentData)
    : null;

  const [created] = await db
    .insert(properties)
    .values({
      titulo: input.titulo.trim(),
      slug,
      descripcion: input.descripcion.trim(),
      precio: input.precio.toFixed(2),
      moneda: input.moneda,
      m2: input.m2,
      ambientes: input.ambientes,
      banos: input.banos,
      ubicacion: input.ubicacion.trim(),
      barrio: input.barrio.trim(),
      ciudad: input.ciudad.trim() || "Buenos Aires",
      categoria: input.kind === "development" ? "emprendimiento" : input.categoria,
      imagenUrl: normalizedImageUrls[0] ?? null,
      destacada: input.destacada,
      estado: input.estado,
      publicado: input.publishStatus === "published",
      source: "local",
      kind: input.kind,
      publishStatus: input.publishStatus,
      developmentStage: input.kind === "development" ? input.developmentStage : "none",
      developmentId,
      developmentName: normalizedDevelopmentName ?? null,
      developmentData,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      ...(publishedAt ? { publishedAt } : {}),
      ...(archivedAt ? { archivedAt } : {}),
      updatedAt: now,
    })
    .returning({ id: properties.id });

  if (normalizedImageUrls.length > 0) {
    await db.insert(propertyImages).values(
      normalizedImageUrls.map((url, index) => ({
        propertyId: created.id,
        url,
        alt: `${input.titulo.trim()} - imagen ${index + 1}`,
        orden: index,
        isMain: index === 0,
      })),
    );
  }

  return created.id;
}

export async function updateLocalProperty(input: UpdateLocalPropertyInput) {
  const existing = await db.query.properties.findFirst({
    where: and(eq(properties.id, input.id), eq(properties.source, "local")),
    with: {
      propertyImages: true,
    },
  });

  if (!existing) {
    throw new Error("Solo podés editar desarrollos locales.");
  }

  const normalizedImageUrls = (input.imageUrls ?? []).map((url) => url.trim()).filter(Boolean);
  const now = new Date();
  const normalizedDevelopmentName = input.kind === "development"
    ? (input.developmentName?.trim() || input.titulo.trim())
    : undefined;
  const developmentId = input.kind === "development" && input.developmentStage === "upcoming"
    ? existing.developmentId || `local-${existing.slug || slugify(normalizedDevelopmentName || input.titulo)}`
    : null;
  const developmentData = input.kind === "development"
    ? JSON.stringify({
        description: input.descripcion.trim(),
        photos: normalizedImageUrls,
        address: input.developmentAddress?.trim() || input.ubicacion.trim(),
        constructionDate: input.developmentConstructionDate?.trim() || undefined,
        amenities: (input.developmentAmenities ?? []).map((item) => item.trim()).filter(Boolean),
        location: input.barrio.trim(),
      } satisfies PropertyDevelopmentData)
    : null;

  await db
    .update(properties)
    .set({
      titulo: input.titulo.trim(),
      descripcion: input.descripcion.trim(),
      precio: input.precio.toFixed(2),
      moneda: input.moneda,
      m2: input.m2,
      ambientes: input.ambientes,
      banos: input.banos,
      ubicacion: input.ubicacion.trim(),
      barrio: input.barrio.trim(),
      ciudad: input.ciudad.trim() || "Buenos Aires",
      categoria: input.kind === "development" ? "emprendimiento" : input.categoria,
      imagenUrl: normalizedImageUrls[0] ?? null,
      destacada: input.destacada,
      estado: input.estado,
      publicado: input.publishStatus === "published",
      source: "local",
      kind: input.kind,
      publishStatus: input.publishStatus,
      developmentStage: input.kind === "development" ? input.developmentStage : "none",
      developmentId,
      developmentName: normalizedDevelopmentName ?? null,
      developmentData,
      updatedBy: input.createdBy,
      publishedAt: input.publishStatus === "published" ? existing.publishedAt ?? now : null,
      archivedAt: input.publishStatus === "archived" ? now : null,
      updatedAt: now,
    })
    .where(and(eq(properties.id, input.id), eq(properties.source, "local")));

  await db.delete(propertyImages).where(eq(propertyImages.propertyId, input.id));

  if (normalizedImageUrls.length > 0) {
    await db.insert(propertyImages).values(
      normalizedImageUrls.map((url, index) => ({
        propertyId: input.id,
        url,
        alt: `${input.titulo.trim()} - imagen ${index + 1}`,
        orden: index,
        isMain: index === 0,
      })),
    );
  }

  return input.id;
}

export async function deleteLocalProperty(id: string) {
  const deleted = await db
    .delete(properties)
    .where(and(eq(properties.id, id), eq(properties.source, "local")))
    .returning({ id: properties.id });

  if (deleted.length === 0) {
    throw new Error("Solo podés eliminar desarrollos locales.");
  }

  return deleted[0].id;
}

export async function getEditableLocalPropertyIds() {
  try {
    const rows = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.source, "local"));
    return rows.map((row) => row.id);
  } catch {
    return [];
  }
}
