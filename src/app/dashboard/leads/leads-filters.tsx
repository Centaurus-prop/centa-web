"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/types/lead";
import { STATUS_LABELS, SOURCE_LABELS } from "@/lib/lead-labels";

interface LeadsFiltersProps {
  asesores: { id: string; name: string }[];
}

export function LeadsFilters({ asesores }: LeadsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const status = searchParams.get("status") ?? "";
  const source = searchParams.get("source") ?? "";
  const assignee = searchParams.get("assignee") ?? "";

  function applyParams(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() => {
      router.replace(`/dashboard/leads${next.toString() ? `?${next.toString()}` : ""}`);
    });
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyParams({ q: q.trim() });
  }

  const hasFilters = Boolean(status || source || assignee || searchParams.get("q"));

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] md:flex-row md:items-center md:flex-wrap">
      <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono..."
          className="h-9 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-3 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-centa-green-1 focus-visible:ring-2 focus-visible:ring-centa-green-1/20"
        />
      </form>

      <select
        value={status}
        onChange={(e) => applyParams({ status: e.target.value })}
        className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-centa-black outline-none focus-visible:ring-2 focus-visible:ring-centa-green-1/20"
      >
        <option value="">Todos los estados</option>
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={source}
        onChange={(e) => applyParams({ source: e.target.value })}
        className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-centa-black outline-none focus-visible:ring-2 focus-visible:ring-centa-green-1/20"
      >
        <option value="">Todas las fuentes</option>
        {LEAD_SOURCES.map((s) => (
          <option key={s} value={s}>
            {SOURCE_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={assignee}
        onChange={(e) => applyParams({ assignee: e.target.value })}
        className="h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-centa-black outline-none focus-visible:ring-2 focus-visible:ring-centa-green-1/20"
      >
        <option value="">Cualquier asesor</option>
        <option value="unassigned">Sin asignar</option>
        {asesores.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            startTransition(() => router.replace("/dashboard/leads"));
          }}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-gray-100 hover:text-centa-black transition-colors"
        >
          <X className="size-3.5" />
          Limpiar
        </button>
      )}
    </div>
  );
}
