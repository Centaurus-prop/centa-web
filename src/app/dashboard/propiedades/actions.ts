"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { properties } from "@/db/schema";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createLocalProperty, deleteLocalProperty, updateLocalProperty } from "@/lib/properties";
import type {
  Currency,
  DevelopmentStage,
  PropertyCategory,
  PropertyKind,
  PropertyStatus,
  PublishStatus,
} from "@/types/property";

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function parseInteger(value: FormDataEntryValue | null, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`El campo ${field} es inválido.`);
  }
  return Math.round(parsed);
}

function parsePrice(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("El precio es inválido.");
  }
  return parsed;
}

function parseEnumValue<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
  field: string,
  fallback: T,
): T {
  const rawValue = String(value ?? fallback).trim() as T;
  if (!allowed.includes(rawValue)) {
    throw new Error(`El campo ${field} es inválido.`);
  }
  return rawValue;
}

const PROPERTY_KIND_VALUES = ["property", "development"] as const satisfies readonly PropertyKind[];
const PUBLISH_STATUS_VALUES = ["draft", "review", "published", "archived"] as const satisfies readonly PublishStatus[];
const DEVELOPMENT_STAGE_VALUES = ["none", "upcoming", "active", "delivered"] as const satisfies readonly DevelopmentStage[];
const PROPERTY_CATEGORY_VALUES = ["a-estrenar", "usado", "emprendimiento"] as const satisfies readonly PropertyCategory[];
const PROPERTY_STATUS_VALUES = ["disponible", "reservado", "vendido"] as const satisfies readonly PropertyStatus[];
const CURRENCY_VALUES = ["ARS", "USD"] as const satisfies readonly Currency[];

function getLocalPropertyInput(formData: FormData, userId: string) {
  const developmentName = String(formData.get("developmentName") ?? "").trim();
  const kindCandidate = String(formData.get("kind") ?? "property").trim();
  const titulo = String(formData.get("titulo") ?? "").trim() || (kindCandidate === "development" ? developmentName : "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const ubicacion = String(formData.get("ubicacion") ?? "").trim();
  const barrio = String(formData.get("barrio") ?? "").trim() || ubicacion;
  const ciudad = String(formData.get("ciudad") ?? "Buenos Aires").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  const constructionDate = String(formData.get("constructionDate") ?? "").trim();
  const amenities = String(formData.get("amenities") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const imageUrls = String(formData.get("imageUrls") ?? "")
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);

  if (!titulo || !descripcion || !ubicacion || !barrio) {
    throw new Error("Completá nombre, descripción, ubicación y barrio.");
  }

  const kind = parseEnumValue(formData.get("kind"), PROPERTY_KIND_VALUES, "kind", "property");
  const publishStatus = parseEnumValue(
    formData.get("publishStatus"),
    PUBLISH_STATUS_VALUES,
    "publishStatus",
    "draft",
  );
  const category = parseEnumValue(formData.get("categoria"), PROPERTY_CATEGORY_VALUES, "categoria", "usado");
  const developmentStage = parseEnumValue(
    formData.get("developmentStage"),
    DEVELOPMENT_STAGE_VALUES,
    "developmentStage",
    "none",
  );
  const moneda = parseEnumValue(formData.get("moneda"), CURRENCY_VALUES, "moneda", "USD");
  const estado = parseEnumValue(formData.get("estado"), PROPERTY_STATUS_VALUES, "estado", "disponible");

  return {
    titulo,
    descripcion,
    precio: parsePrice(formData.get("precio")),
    moneda,
    m2: parseInteger(formData.get("m2"), "m2"),
    ambientes: parseInteger(formData.get("ambientes"), "ambientes"),
    banos: parseInteger(formData.get("banos"), "banos"),
    ubicacion,
    barrio,
    ciudad,
    categoria: kind === "development" ? "emprendimiento" : category,
    estado,
    destacada: parseBoolean(formData.get("destacada")),
    kind,
    publishStatus,
    developmentStage: kind === "development" ? developmentStage : "none",
    developmentName: developmentName || undefined,
    slug: String(formData.get("slug") ?? "").trim() || undefined,
    imageUrls,
    developmentAddress: direccion || undefined,
    developmentConstructionDate: constructionDate || undefined,
    developmentAmenities: amenities,
    createdBy: userId,
  };
}

export async function createLocalPropertyAction(
  _prevState: { ok: boolean; message: string },
  formData: FormData,
) {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, message: "Tu sesión venció. Volvé a iniciar sesión." };
  }

  try {
    await createLocalProperty(getLocalPropertyInput(formData, session.userId));

    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/emprendimientos");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/propiedades");
    revalidatePath("/dashboard/nuevo-desarrollo");

    return { ok: true as const, message: "Propiedad local creada." };
  } catch (error) {
    console.error("[createLocalPropertyAction]", error);
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "No se pudo crear la propiedad. Intentá de nuevo.",
    };
  }
}

export async function updateLocalPropertyAction(
  _prevState: { ok: boolean; message: string },
  formData: FormData,
) {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, message: "Tu sesión venció. Volvé a iniciar sesión." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { ok: false as const, message: "Falta identificar el desarrollo a editar." };
  }

  try {
    await updateLocalProperty({
      id,
      ...getLocalPropertyInput(formData, session.userId),
    });

    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/emprendimientos");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/propiedades");
    revalidatePath("/dashboard/nuevo-desarrollo");

    return { ok: true as const, message: "Desarrollo actualizado." };
  } catch (error) {
    console.error("[updateLocalPropertyAction]", error);
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "No se pudo actualizar la propiedad. Intentá de nuevo.",
    };
  }
}

export async function deleteLocalPropertyAction(id: string) {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, message: "Tu sesión venció. Volvé a iniciar sesión." };
  }

  try {
    await deleteLocalProperty(id);

    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/emprendimientos");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/propiedades");
    revalidatePath("/dashboard/nuevo-desarrollo");

    return { ok: true as const, message: "Desarrollo eliminado." };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "No se pudo eliminar la propiedad.",
    };
  }
}

export async function toggleFeaturedAction(id: string) {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, message: "Tu sesión venció." };
  }

  try {
    const isTokkoId = /^\d+$/.test(id);

    if (isTokkoId) {
      const existing = await db.query.properties.findFirst({
        where: eq(properties.tokkoId, Number(id)),
        columns: { id: true, destacada: true },
      });

      const nextDestacada = existing ? !existing.destacada : true;

      if (existing) {
        await db.update(properties).set({ destacada: nextDestacada }).where(eq(properties.id, existing.id));
      } else {
        await db.insert(properties).values({
          tokkoId: Number(id),
          titulo: "",
          precio: "0",
          m2: 0,
          ambientes: 0,
          banos: 0,
          ubicacion: "",
          barrio: "",
          ciudad: "Buenos Aires",
          categoria: "usado",
          destacada: nextDestacada,
          source: "tokko",
        });
      }

      revalidatePath("/");
      revalidatePath("/catalogo");
      revalidatePath("/dashboard/propiedades");
      return { ok: true as const, destacada: nextDestacada };
    }

    const existing = await db.query.properties.findFirst({
      where: eq(properties.id, id),
      columns: { destacada: true },
    });

    if (!existing) {
      return { ok: false as const, message: "Propiedad no encontrada." };
    }

    const nextDestacada = !existing.destacada;
    await db.update(properties).set({ destacada: nextDestacada }).where(eq(properties.id, id));

    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/dashboard/propiedades");
    return { ok: true as const, destacada: nextDestacada };
  } catch (error) {
    console.error("[toggleFeaturedAction]", error);
    return { ok: false as const, message: "No se pudo actualizar." };
  }
}
