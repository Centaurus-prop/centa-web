import type { LeadSource, LeadStatus } from "@/types/lead";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  en_progreso: "En progreso",
  descartado: "Descartado",
  convertido: "Convertido",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  web: "Sitio web",
  tokko: "Tokko",
  whatsapp: "WhatsApp",
  manual: "Manual",
};
