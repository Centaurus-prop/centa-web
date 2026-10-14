import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getSession, createSession, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export const runtime = "nodejs";

interface ChangePasswordBody {
  newPassword: string;
}

function parseBody(value: unknown): ChangePasswordBody | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.newPassword !== "string") return null;
  return { newPassword: v.newPassword };
}

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Z]/.test(password)) return "La contraseña debe tener al menos una mayúscula";
  if (!/[a-z]/.test(password)) return "La contraseña debe tener al menos una minúscula";
  if (!/[0-9]/.test(password)) return "La contraseña debe tener al menos un número";
  return null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const body = parseBody(raw);
  if (!body) {
    return NextResponse.json({ error: "newPassword es requerido" }, { status: 400 });
  }

  const strengthError = validatePasswordStrength(body.newPassword);
  if (strengthError) {
    return NextResponse.json({ error: strengthError }, { status: 422 });
  }

  try {
    const passwordHash = await hash(body.newPassword, 12);

    await db
      .update(users)
      .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(users.id, session.userId));

    const newToken = await createSession({
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      mustChangePassword: false,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_OPTIONS.name, newToken, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("Change-password error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
