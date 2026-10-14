import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { createSession, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/session-token";

export const runtime = "nodejs";

interface LoginBody {
  email: string;
  password: string;
}

function parseBody(value: unknown): LoginBody | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.email !== "string" || typeof v.password !== "string") return null;
  const email = v.email.trim().toLowerCase();
  const password = v.password;
  if (!email || !password) return null;
  if (email.length > 255 || password.length > 200) return null;
  return { email, password };
}

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const body = parseBody(raw);
  if (!body) {
    return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (!user || !user.passwordHash || !user.active) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await compare(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    if (!isRole(user.role)) {
      console.error("Login error: invalid role on user", user.id, user.role);
      return NextResponse.json({ error: "Cuenta inválida" }, { status: 500 });
    }

    // TODO: rate limiting — ver TEN-271
    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    response.cookies.set(SESSION_COOKIE_OPTIONS.name, token, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
