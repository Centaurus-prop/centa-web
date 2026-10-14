import { NextResponse } from "next/server";
import { eq, and, ne, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/session-token";

export const runtime = "nodejs";

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

interface PatchUserBody {
  name?: string;
  role?: Role;
  phone?: string;
  active?: boolean;
}

function parsePatchBody(value: unknown): PatchUserBody | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const result: PatchUserBody = {};
  if ("name" in v) {
    if (typeof v.name !== "string" || v.name.trim().length === 0) return null;
    result.name = v.name.trim();
  }
  if ("role" in v) {
    if (!isRole(v.role)) return null;
    result.role = v.role as Role;
  }
  if ("phone" in v) {
    result.phone = typeof v.phone === "string" ? v.phone.trim() : undefined;
  }
  if ("active" in v) {
    if (typeof v.active !== "boolean") return null;
    result.active = v.active;
  }
  return result;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const body = parsePatchBody(raw);
  if (!body) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Admin cannot change their own role or deactivate themselves
  if (id === session.userId && ("role" in body || "active" in body)) {
    return NextResponse.json(
      { error: "Un admin no puede modificar su propio rol ni desactivarse" },
      { status: 409 },
    );
  }

  // Guard: ensure at least one active admin remains
  if ("role" in body || "active" in body) {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: { role: true, active: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const wouldLoseAdmin =
      (targetUser.role === "admin" && "role" in body && body.role !== "admin") ||
      (targetUser.active === true && "active" in body && body.active === false);

    if (wouldLoseAdmin && targetUser.role === "admin") {
      const [{ value: adminCount }] = await db
        .select({ value: count() })
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, id)));

      if (adminCount === 0) {
        return NextResponse.json(
          { error: "No se puede quedar sin administradores activos" },
          { status: 409 },
        );
      }
    }
  }

  try {
    const updates: Partial<typeof users.$inferInsert> = { ...body, updatedAt: new Date() };

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        active: users.active,
        phone: users.phone,
      });

    if (!updated) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
