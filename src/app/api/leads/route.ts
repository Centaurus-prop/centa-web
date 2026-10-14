import { NextResponse } from "next/server";
import { createLead } from "@/lib/leads";

export const runtime = "nodejs";

interface LeadBody {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  propertyId?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROPERTY_ID_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

function parseBody(value: unknown): { ok: true; body: LeadBody } | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Cuerpo de la solicitud inválido" };
  }
  const v = value as Record<string, unknown>;

  if (typeof v.name !== "string" || v.name.trim().length === 0) {
    return { ok: false, error: "El nombre es requerido" };
  }
  const name = v.name.trim().slice(0, 150);

  const email = typeof v.email === "string" ? v.email.trim().toLowerCase() : "";
  const phone = typeof v.phone === "string" ? v.phone.trim() : "";
  const message = typeof v.message === "string" ? v.message.trim() : "";
  const propertyIdRaw = typeof v.propertyId === "string" ? v.propertyId.trim() : "";

  if (!email && !phone) {
    return { ok: false, error: "Necesitamos al menos un email o teléfono para contactarte" };
  }
  if (email && (!EMAIL_REGEX.test(email) || email.length > 255)) {
    return { ok: false, error: "Email inválido" };
  }
  if (phone && phone.length > 30) {
    return { ok: false, error: "Teléfono inválido" };
  }
  if (message.length > 2000) {
    return { ok: false, error: "El mensaje es demasiado largo" };
  }
  if (propertyIdRaw && !PROPERTY_ID_REGEX.test(propertyIdRaw)) {
    return { ok: false, error: "Identificador de propiedad inválido" };
  }

  return {
    ok: true,
    body: {
      name,
      email: email || undefined,
      phone: phone || undefined,
      message: message || undefined,
      propertyId: propertyIdRaw || undefined,
    },
  };
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const parsed = parseBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const lead = await createLead({ ...parsed.body, source: "web" });
    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    console.error("[POST /api/leads] failed", error);
    return NextResponse.json({ error: "Error interno. Intentalo más tarde." }, { status: 500 });
  }
}
