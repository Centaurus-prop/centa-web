import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
