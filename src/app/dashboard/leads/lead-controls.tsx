"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { changeLeadStatusAction, assignLeadAction } from "./actions";
import { LEAD_STATUSES, type LeadStatus } from "@/types/lead";
import { STATUS_LABELS } from "@/lib/lead-labels";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<LeadStatus, string> = {
  nuevo: "bg-blue-50 text-blue-700 border-blue-200",
  contactado: "bg-amber-50 text-amber-700 border-amber-200",
  en_progreso: "bg-purple-50 text-purple-700 border-purple-200",
  convertido: "bg-centa-green-3/20 text-centa-green-1 border-centa-green-3/40",
  descartado: "bg-gray-100 text-gray-600 border-gray-200",
};

interface StatusSelectProps {
  leadId: string;
  current: LeadStatus;
  readOnly?: boolean;
}

export function StatusSelect({ leadId, current, readOnly = false }: StatusSelectProps) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<LeadStatus>(current);

  if (readOnly) {
    return (
      <span
        className={cn(
          "inline-flex rounded-md border px-2 py-1 text-xs font-medium",
          STATUS_STYLES[value],
        )}
      >
        {STATUS_LABELS[value]}
      </span>
    );
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as LeadStatus;
    setValue(next);
    const formData = new FormData();
    formData.set("id", leadId);
    formData.set("status", next);
    startTransition(() => {
      void changeLeadStatusAction(formData);
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={pending}
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-centa-green-1/30",
        STATUS_STYLES[value],
        pending && "opacity-60",
      )}
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-centa-black">
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

interface AsesorOption {
  id: string;
  name: string;
}

interface AssigneeSelectProps {
  leadId: string;
  current: string | null;
  asesores: AsesorOption[];
  readOnly?: boolean;
}

export function AssigneeSelect({ leadId, current, asesores, readOnly = false }: AssigneeSelectProps) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<string>(current ?? "unassigned");

  if (readOnly) {
    const assignee = asesores.find((a) => a.id === value);
    return (
      <span className="inline-flex rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-centa-black">
        {assignee?.name ?? "Sin asignar"}
      </span>
    );
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    setValue(next);
    const formData = new FormData();
    formData.set("id", leadId);
    formData.set("assignee", next);
    startTransition(() => {
      void assignLeadAction(formData);
    });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={pending}
      className={cn(
        "rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-centa-black transition-colors outline-none focus-visible:ring-2 focus-visible:ring-centa-green-1/30",
        pending && "opacity-60",
      )}
    >
      <option value="unassigned">Sin asignar</option>
      {asesores.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}
