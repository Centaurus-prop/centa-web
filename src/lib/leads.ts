import "server-only";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "./db";
import { leads, properties, users, type LeadRecord } from "@/db/schema";
import { LEAD_STATUSES, LEAD_SOURCES, type LeadStatus, type LeadSource } from "@/types/lead";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export { LEAD_STATUSES, LEAD_SOURCES };
export type { LeadStatus, LeadSource };

export interface LeadWithAssignee extends LeadRecord {
  assignee: { id: string; name: string; email: string } | null;
  property: { id: string; titulo: string; slug: string | null; tokkoId: number | null } | null;
}

export interface ListLeadsFilters {
  status?: LeadStatus;
  source?: LeadSource;
  q?: string;
  assignedTo?: string;
}

export async function listLeads(filters: ListLeadsFilters = {}): Promise<LeadWithAssignee[]> {
  const conditions = [];

  if (filters.status) conditions.push(eq(leads.status, filters.status));
  if (filters.source) conditions.push(eq(leads.source, filters.source));
  if (filters.assignedTo === "unassigned") {
    conditions.push(sql`${leads.assignedTo} is null`);
  } else if (filters.assignedTo) {
    conditions.push(eq(leads.assignedTo, filters.assignedTo));
  }
  if (filters.q) {
    const needle = `%${filters.q}%`;
    const search = or(
      ilike(leads.name, needle),
      ilike(leads.email, needle),
      ilike(leads.phone, needle),
      ilike(leads.message, needle),
    );
    if (search) conditions.push(search);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      lead: leads,
      assignee: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      property: {
        id: properties.id,
        titulo: properties.titulo,
        slug: properties.slug,
        tokkoId: properties.tokkoId,
      },
    })
    .from(leads)
    .leftJoin(users, eq(leads.assignedTo, users.id))
    .leftJoin(properties, eq(leads.propertyId, properties.id))
    .where(whereClause)
    .orderBy(desc(leads.createdAt));

  return rows.map((row) => ({
    ...row.lead,
    assignee: row.assignee?.id ? row.assignee : null,
    property: row.property?.id ? row.property : null,
  }));
}

export interface NewLeadInput {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  propertyId?: string;
  source?: LeadSource;
}

async function resolveLocalPropertyId(
  rawId: string,
): Promise<{ propertyId: string | null; unmatchedRef: string | null }> {
  if (!rawId) return { propertyId: null, unmatchedRef: null };

  if (UUID_REGEX.test(rawId)) {
    const [row] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, rawId))
      .limit(1);
    if (row) return { propertyId: row.id, unmatchedRef: null };
    return { propertyId: null, unmatchedRef: rawId };
  }

  const numeric = Number(rawId);
  if (Number.isInteger(numeric) && numeric > 0) {
    const [row] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.tokkoId, numeric))
      .limit(1);
    if (row) return { propertyId: row.id, unmatchedRef: null };
  }

  return { propertyId: null, unmatchedRef: rawId };
}

export async function createLead(input: NewLeadInput): Promise<LeadRecord> {
  const { propertyId, unmatchedRef } = input.propertyId
    ? await resolveLocalPropertyId(input.propertyId)
    : { propertyId: null, unmatchedRef: null };

  const message = input.message?.trim() || null;
  const notes = unmatchedRef ? `Propiedad referida (sin sincronizar localmente): ${unmatchedRef}` : null;

  const [created] = await db
    .insert(leads)
    .values({
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      message,
      notes,
      propertyId,
      source: input.source ?? "web",
      status: "nuevo",
    })
    .returning();

  return created;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, id));
}

export async function assignLead(id: string, userId: string | null): Promise<void> {
  await db
    .update(leads)
    .set({ assignedTo: userId, updatedAt: new Date() })
    .where(eq(leads.id, id));
}

export interface LeadKpis {
  total: number;
  nuevos: number;
  enProgreso: number;
  convertidos: number;
  descartados: number;
  conversionRate: number;
  bySource: Record<LeadSource, number>;
  last7Days: number;
}

export async function getLeadKpis(): Promise<LeadKpis> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const rows = await db.select({ status: leads.status, source: leads.source, createdAt: leads.createdAt }).from(leads);

  const bySource: Record<LeadSource, number> = {
    web: 0,
    tokko: 0,
    whatsapp: 0,
    manual: 0,
  };

  let nuevos = 0;
  let enProgreso = 0;
  let convertidos = 0;
  let descartados = 0;
  let last7Days = 0;

  for (const row of rows) {
    if (row.status === "nuevo") nuevos += 1;
    else if (row.status === "en_progreso" || row.status === "contactado") enProgreso += 1;
    else if (row.status === "convertido") convertidos += 1;
    else if (row.status === "descartado") descartados += 1;

    if (row.source && row.source in bySource) {
      bySource[row.source as LeadSource] += 1;
    }

    if (row.createdAt && row.createdAt >= sevenDaysAgo) last7Days += 1;
  }

  const total = rows.length;
  const conversionRate = total > 0 ? (convertidos / total) * 100 : 0;

  return {
    total,
    nuevos,
    enProgreso,
    convertidos,
    descartados,
    conversionRate,
    bySource,
    last7Days,
  };
}

export interface AsesorStats {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  totalLeads: number;
  enProgreso: number;
  convertidos: number;
  lastLoginAt: Date | null;
}

export async function getAsesoresStats(): Promise<AsesorStats[]> {
  const userRows = await db
    .select()
    .from(users)
    .where(or(eq(users.role, "admin"), eq(users.role, "asesor")))
    .orderBy(users.name);

  if (userRows.length === 0) return [];

  const leadRows = await db
    .select({ assignedTo: leads.assignedTo, status: leads.status })
    .from(leads);

  return userRows.map((u) => {
    const userLeads = leadRows.filter((l) => l.assignedTo === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      totalLeads: userLeads.length,
      enProgreso: userLeads.filter((l) => l.status === "en_progreso" || l.status === "contactado").length,
      convertidos: userLeads.filter((l) => l.status === "convertido").length,
      lastLoginAt: u.lastLoginAt,
    };
  });
}

export async function listAsesoresMinimal(): Promise<{ id: string; name: string; role: string }[]> {
  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role, active: users.active })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(users.name);
  return rows
    .filter((r) => r.role === "asesor" || r.role === "admin")
    .map(({ id, name, role }) => ({ id, name, role }));
}
