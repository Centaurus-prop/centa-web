import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/session-token";

export const runtime = "nodejs";

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

function generateTemporaryPassword(): string {
  return randomBytes(9).toString("base64url").substring(0, 12);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const rows = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        phone: true,
        lastLoginAt: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: (u, { asc }) => [asc(u.createdAt)],
    });

    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

interface CreateUserBody {
  email: string;
  name: string;
  role: Role;
  phone?: string;
}

function parseCreateBody(value: unknown): CreateUserBody | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.email !== "string" || typeof v.name !== "string") return null;
  if (!isRole(v.role)) return null;
  const email = v.email.trim().toLowerCase();
  const name = (v.name as string).trim();
  if (!email || !name) return null;
  if (email.length > 255 || name.length > 150) return null;
  const phone = typeof v.phone === "string" ? v.phone.trim() : undefined;
  return { email, name, role: v.role as Role, phone };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const body = parseCreateBody(raw);
  if (!body) {
    return NextResponse.json({ error: "email, name y role son requeridos" }, { status: 400 });
  }

  try {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hash(temporaryPassword, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        email: body.email,
        name: body.name,
        role: body.role,
        phone: body.phone,
        passwordHash,
        mustChangePassword: true,
        active: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    return NextResponse.json(
      { user: newUser, temporaryPassword },
      { status: 201 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
