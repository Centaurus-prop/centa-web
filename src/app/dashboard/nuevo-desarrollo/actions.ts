"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import {
  createDevelopment,
  deleteDevelopment,
  updateDevelopment,
} from "@/lib/developments";

export async function createDevelopmentAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
) {
  const session = await getSession();
  if (!session) return { ok: false, message: "Tu sesión venció." };

  try {
    const name = String(formData.get("developmentName") ?? "").trim();
    const description = String(formData.get("descripcion") ?? "").trim();
    const address = String(formData.get("direccion") ?? "").trim();
    const location = String(formData.get("ubicacion") ?? "").trim();
    const price = String(formData.get("precio") ?? "").trim();
    const currency = String(formData.get("moneda") ?? "USD").trim();
    const constructionDate = String(formData.get("constructionDate") ?? "").trim();
    const amenities = String(formData.get("amenities") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const imageUrlsValue = String(formData.get("imageUrls") ?? "").trim();
    console.info("[createDevelopmentAction] imageUrls", imageUrlsValue);
    const imageUrls = imageUrlsValue
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!name) return { ok: false, message: "El nombre es obligatorio." };

    await createDevelopment({
      name,
      description: description || undefined,
      address: address || undefined,
      location: location || undefined,
      price: price || undefined,
      currency,
      constructionDate: constructionDate || undefined,
      amenities,
      images: imageUrls,
      createdBy: session.userId,
    });

    revalidatePath("/");
    revalidatePath("/emprendimientos");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/nuevo-desarrollo");

    return { ok: true, message: "Desarrollo creado exitosamente." };
  } catch (error) {
    console.error("[createDevelopment]", error);
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo crear el desarrollo." };
  }
}

export async function updateDevelopmentAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
) {
  const session = await getSession();
  if (!session) return { ok: false, message: "Tu sesión venció." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Falta el ID del desarrollo." };

  try {
    const name = String(formData.get("developmentName") ?? "").trim();
    const description = String(formData.get("descripcion") ?? "").trim();
    const address = String(formData.get("direccion") ?? "").trim();
    const location = String(formData.get("ubicacion") ?? "").trim();
    const price = String(formData.get("precio") ?? "").trim();
    const currency = String(formData.get("moneda") ?? "USD").trim();
    const constructionDate = String(formData.get("constructionDate") ?? "").trim();
    const amenities = String(formData.get("amenities") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const imageUrlsValue = String(formData.get("imageUrls") ?? "").trim();
    console.info("[updateDevelopmentAction] imageUrls", imageUrlsValue);
    const imageUrls = imageUrlsValue
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    await updateDevelopment(id, {
      name,
      description,
      address,
      location,
      price,
      currency,
      constructionDate,
      amenities,
      images: imageUrls,
      published: true,
      status: "upcoming",
    });

    revalidatePath("/");
    revalidatePath("/emprendimientos");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/nuevo-desarrollo");

    return { ok: true, message: "Desarrollo actualizado exitosamente." };
  } catch (error) {
    console.error("[updateDevelopment]", error);
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo actualizar." };
  }
}

export async function deleteDevelopmentAction(id: string) {
  const session = await getSession();
  if (!session) return { ok: false, message: "Tu sesión venció." };

  try {
    await deleteDevelopment(id);

    revalidatePath("/");
    revalidatePath("/emprendimientos");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/nuevo-desarrollo");

    return { ok: true, message: "Desarrollo eliminado." };
  } catch (error) {
    console.error("[deleteDevelopment]", error);
    return { ok: false, message: "No se pudo eliminar." };
  }
}

export async function toggleFeaturedDevelopmentAction(id: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, message: "Tu sesión venció." };

  try {
    const { db } = await import("@/lib/db");
    const { developments } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const existing = await db.query.developments.findFirst({
      where: eq(developments.id, id),
      columns: { destacada: true },
    });

    if (!existing) return { ok: false as const, message: "Desarrollo no encontrado." };

    const nextDestacada = !existing.destacada;
    await db.update(developments).set({ destacada: nextDestacada }).where(eq(developments.id, id));

    revalidatePath("/");
    revalidatePath("/emprendimientos");
    revalidatePath("/dashboard/nuevo-desarrollo");
    return { ok: true as const, destacada: nextDestacada };
  } catch (error) {
    console.error("[toggleFeaturedDevelopmentAction]", error);
    return { ok: false as const, message: "No se pudo actualizar." };
  }
}
