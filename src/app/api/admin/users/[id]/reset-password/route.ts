import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

function generateTemporaryPassword(): string {
  return randomBytes(9).toString("base64url").substring(0, 12);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<unknown> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = (await params) as { id: string };

  try {
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hash(temporaryPassword, 12);

    const [updated] = await db
      .update(users)
      .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!updated) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ temporaryPassword });
  } catch (error) {
    console.error("POST /api/admin/users/[id]/reset-password error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
