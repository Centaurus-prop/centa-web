export const LEAD_STATUSES = [
  "nuevo",
  "contactado",
  "en_progreso",
  "descartado",
  "convertido",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ["web", "tokko", "whatsapp", "manual"] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
