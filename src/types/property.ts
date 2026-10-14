export type PropertyCategory = "a-estrenar" | "usado" | "emprendimiento";
export type PropertyStatus = "disponible" | "reservado" | "vendido";
export type Currency = "ARS" | "USD";
export type PropertySource = "mock" | "tokko" | "local";
export type PropertyKind = "property" | "development";
export type PublishStatus = "draft" | "review" | "published" | "archived";
export type DevelopmentStage = "none" | "upcoming" | "active" | "delivered";

export interface PropertyImage {
  url: string;
  alt?: string;
  orden?: number;
  isMain?: boolean;
}

export interface PropertyCoordinates {
  lat: number;
  lng: number;
}

export interface PropertyDevelopmentData {
  description?: string;
  photos: string[];
  address?: string;
  constructionDate?: string;
  amenities: string[];
  location?: string;
  lat?: number;
  lng?: number;
}

export interface Property {
  id: string;
  titulo: string;
  descripcion: string;
  createdAt?: string;
  precio: number;
  moneda: Currency;
  m2: number;
  ambientes: number;
  banos: number;
  ubicacion: string;
  barrio: string;
  ciudad: string;
  coordenadas?: PropertyCoordinates;
  categoria: PropertyCategory;
  imagenUrl: string;
  imagenes?: PropertyImage[];
  destacada: boolean;
  estado: PropertyStatus;
  operacion?: string;
  tipo?: string;
  direccion?: string;
  superficieCubierta?: number | null;
  superficieTotal?: number | null;
  dormitorios?: number | null;
  expensas?: number | null;
  antiguedad?: number | null;
  fuente?: PropertySource;
  kind?: PropertyKind;
  publishStatus?: PublishStatus;
  developmentStage?: DevelopmentStage;
  slug?: string | null;
  developmentId?: string;
  developmentName?: string;
  developmentData?: PropertyDevelopmentData;
}
