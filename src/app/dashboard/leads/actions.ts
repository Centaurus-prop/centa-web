"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  assignLead,
  updateLeadStatus,
  LEAD_STATUSES,
  type LeadStatus,
} from "@/lib/leads";
import type { Role } from "@/lib/session-token";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEADS_WRITE_ROLES: readonly Role[] = ["admin", "asesor"];
const LEADS_ASSIGN_ROLES: readonly Role[] = ["admin", "asesor"];

export async function changeLeadStatusAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  if (!LEADS_WRITE_ROLES.includes(session.role)) {
    throw new Error("No autorizado");
  }

  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !UUID_REGEX.test(id)) return;
  if (typeof status !== "string") return;
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) return;

  await updateLeadStatus(id, status as LeadStatus);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/metricas");
}

export async function assignLeadAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("No autenticado");
  if (!LEADS_ASSIGN_ROLES.includes(session.role)) {
    throw new Error("No autorizado");
  }

  const id = formData.get("id");
  const assigneeRaw = formData.get("assignee");
  if (typeof id !== "string" || !UUID_REGEX.test(id)) return;
  if (typeof assigneeRaw !== "string") return;

  let assignee: string | null = null;
  if (assigneeRaw && assigneeRaw !== "unassigned") {
    if (!UUID_REGEX.test(assigneeRaw)) return;
    assignee = assigneeRaw;
  }

  await assignLead(id, assignee);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/asesores");
}
