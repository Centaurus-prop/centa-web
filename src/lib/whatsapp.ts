// Canonical number — previously 5491128835021 on float button; 5491178582626 on property card + dialog.
// Consolidated to 5491178582626 (2/3 usages). Board-confirmed production number (TEN-303).
export const WHATSAPP_PHONE = "5491178582626";
export const SITE_URL = "https://www.centapropiedades.com";

export type WhatsAppContext =
  | { type: "property"; name: string; url?: string }
  | { type: "development"; name: string; url?: string }
  | { type: "property_page"; url?: string }
  | { type: "development_page"; url?: string }
  | { type: "catalog" }
  | { type: "developments" }
  | { type: "generic" };

// Append the listing URL so the advisor can open the exact publication the user was viewing.
function withLink(message: string, url?: string): string {
  return url ? `${message}\n\nPublicación: ${url}` : message;
}

export function buildWhatsAppMessage(context: WhatsAppContext): string {
  switch (context.type) {
    case "property":
      return withLink(`Hola, me interesa la propiedad "${context.name}".`, context.url);
    case "development":
      return withLink(`Hola, quiero información sobre el emprendimiento ${context.name}.`, context.url);
    case "property_page":
      return withLink("Hola, me interesa esta propiedad que vi en CENTA. ¿Pueden asesorarme?", context.url);
    case "development_page":
      return withLink("Hola, me interesa este emprendimiento que vi en CENTA. ¿Pueden asesorarme?", context.url);
    case "catalog":
      return "Hola, consulto desde el catálogo de CENTA.";
    case "developments":
      return "Hola, consulto desde emprendimientos en CENTA.";
    case "generic":
      return "Hola, quiero recibir asesoramiento sobre propiedades de CENTA.";
  }
}

export function buildWhatsAppUrl(context: WhatsAppContext, phone = WHATSAPP_PHONE): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(context))}`;
}

// Normalize an arbitrary user-entered phone into wa.me digits (no "+", no spaces/symbols).
// Argentine mobiles require the "549" prefix on WhatsApp (country code 54 + mobile marker 9),
// e.g. "11 4416 2241" → "5491144162241". We assume Argentina since that's the only market.
export function normalizePhoneForWhatsApp(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // Drop a leading international access prefix (00).
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Strip the country code so we can rebuild it consistently as "549".
  if (digits.startsWith("54")) digits = digits.slice(2);
  // Strip the national trunk prefix (0) and the mobile marker (9) if already present.
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("9")) digits = digits.slice(1);
  if (!digits) return null;
  return `549${digits}`;
}

// Build a chat link to message a lead/client directly on WhatsApp.
export function buildLeadWhatsAppUrl(phone: string, message?: string): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// Public listing URL. Tokko-sourced rows keep their data in Tokko (empty local titulo,
// null slug), so the resolvable id is the tokkoId — never the internal UUID.
function propertyPublicUrl(property: {
  slug: string | null;
  tokkoId: number | null;
  id: string;
}): string {
  const ref = property.slug ?? (property.tokkoId ? String(property.tokkoId) : property.id);
  return `${SITE_URL}/propiedad/${ref}`;
}

// Message an advisor sends to a client, tailored to the property the client inquired about.
export function buildAdvisorLeadMessage(input: {
  name: string;
  property?: { titulo: string; slug: string | null; tokkoId: number | null; id: string } | null;
}): string {
  const greeting = `Hola ${input.name}, te contactamos desde CENTA Propiedades`;
  if (input.property) {
    const title = input.property.titulo.trim();
    const subject = title ? ` sobre "${title}"` : "";
    return `${greeting} por tu consulta${subject}.\n\nPublicación: ${propertyPublicUrl(input.property)}`;
  }
  return `${greeting} por tu consulta.`;
}
