"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { eq, and, ne, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/session-token";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

function generateTemporaryPassword(): string {
  return randomBytes(9).toString("base64url").substring(0, 12);
}

async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "No autenticado" };
  if (session.role !== "admin") return { ok: false, error: "Forbidden" };
  return { ok: true, userId: session.userId };
}

async function activeAdminCountExcluding(id: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, id)));
  return value;
}

export async function createUserAction(
  formData: FormData,
): Promise<ActionResult<{ temporaryPassword: string }>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const roleRaw = formData.get("role");
  const phone = (formData.get("phone") as string | null)?.trim() || undefined;

  if (!email || !name || !isRole(roleRaw)) {
    return { ok: false, error: "email, name y role son requeridos" };
  }

  try {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hash(temporaryPassword, 12);

    await db.insert(users).values({
      email,
      name,
      role: roleRaw as Role,
      phone,
      passwordHash,
      mustChangePassword: true,
      active: true,
    });

    revalidatePath("/dashboard/admin");
    return { ok: true, data: { temporaryPassword } };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { ok: false, error: "El email ya está registrado" };
    }
    return { ok: false, error: "Error interno del servidor" };
  }
}

export async function editUserAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (!UUID_REGEX.test(id)) return { ok: false, error: "ID inválido" };
  if (id === auth.userId) return { ok: false, error: "No podés modificar tu propio usuario desde aquí" };

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const roleRaw = formData.get("role");
  const phone = (formData.get("phone") as string | null)?.trim() || undefined;

  if (!name || !isRole(roleRaw)) return { ok: false, error: "Datos inválidos" };

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { role: true, active: true },
  });
  if (!targetUser) return { ok: false, error: "Usuario no encontrado" };

  if (targetUser.role === "admin" && roleRaw !== "admin") {
    const remaining = await activeAdminCountExcluding(id);
    if (remaining === 0) return { ok: false, error: "No se puede quedar sin administradores activos" };
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ name, role: roleRaw as Role, phone, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!updated) return { ok: false, error: "Usuario no encontrado" };

    revalidatePath("/dashboard/admin");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Error interno del servidor" };
  }
}

export async function resetPasswordAction(
  id: string,
): Promise<ActionResult<{ temporaryPassword: string }>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (!UUID_REGEX.test(id)) return { ok: false, error: "ID inválido" };

  try {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hash(temporaryPassword, 12);

    const [updated] = await db
      .update(users)
      .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!updated) return { ok: false, error: "Usuario no encontrado" };

    revalidatePath("/dashboard/admin");
    return { ok: true, data: { temporaryPassword } };
  } catch {
    return { ok: false, error: "Error interno del servidor" };
  }
}

export async function toggleActiveAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (!UUID_REGEX.test(id)) return { ok: false, error: "ID inválido" };
  if (id === auth.userId) return { ok: false, error: "No podés desactivarte a vos mismo" };

  if (!active) {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: { role: true },
    });
    if (targetUser?.role === "admin") {
      const remaining = await activeAdminCountExcluding(id);
      if (remaining === 0) {
        return { ok: false, error: "No se puede quedar sin administradores activos" };
      }
    }
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ active, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!updated) return { ok: false, error: "Usuario no encontrado" };

    revalidatePath("/dashboard/admin");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "Error interno del servidor" };
  }
}
