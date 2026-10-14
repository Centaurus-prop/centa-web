import { MessageSquare, Mail, Phone } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/atoms/page-header";
import { EmptyState } from "@/components/atoms/empty-state";
import { WhatsAppIcon } from "@/components/atoms/whatsapp-icon";
import { buildLeadWhatsAppUrl, buildAdvisorLeadMessage } from "@/lib/whatsapp";
import { getSession } from "@/lib/auth";
import {
  listLeads,
  listAsesoresMinimal,
  LEAD_STATUSES,
  LEAD_SOURCES,
  type LeadStatus,
  type LeadSource,
} from "@/lib/leads";
import { SOURCE_LABELS } from "@/lib/lead-labels";
import { LeadsFilters } from "./leads-filters";
import { StatusSelect, AssigneeSelect } from "./lead-controls";

export const dynamic = "force-dynamic";

function isStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

function isSource(value: string): value is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(value);
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;

  const rawStatus = typeof params.status === "string" ? params.status : "";
  const rawSource = typeof params.source === "string" ? params.source : "";
  const rawAssignee = typeof params.assignee === "string" ? params.assignee : "";
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const filters = {
    status: isStatus(rawStatus) ? rawStatus : undefined,
    source: isSource(rawSource) ? rawSource : undefined,
    assignedTo: rawAssignee || undefined,
    q: q || undefined,
  };

  const [leads, asesores] = await Promise.all([listLeads(filters), listAsesoresMinimal()]);
  const readOnlyControls = session.role === "revisor";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultas"
        description={`${leads.length} consulta${leads.length === 1 ? "" : "s"} encontrada${leads.length === 1 ? "" : "s"}.`}
      />

      <LeadsFilters asesores={asesores} />

      {leads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No hay consultas"
          description="Cuando lleguen consultas desde el sitio web o desde Tokko, las vas a ver acá."
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04]">
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Contacto</th>
                  <th className="px-4 py-3 text-left font-medium">Vía de contacto</th>
                  <th className="px-4 py-3 text-left font-medium">Mensaje</th>
                  <th className="px-4 py-3 text-left font-medium">Fuente</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Asesor</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-centa-black">{lead.name}</p>
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {lead.email && (
                          <p className="flex items-center gap-1">
                            <Mail className="size-3" />
                            <a href={`mailto:${lead.email}`} className="hover:text-centa-green-1">
                              {lead.email}
                            </a>
                          </p>
                        )}
                        {lead.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="size-3" />
                            <a href={`tel:${lead.phone}`} className="hover:text-centa-green-1">
                              {lead.phone}
                            </a>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {(() => {
                        const waUrl = lead.phone
                          ? buildLeadWhatsAppUrl(
                              lead.phone,
                              buildAdvisorLeadMessage({ name: lead.name, property: lead.property }),
                            )
                          : null;
                        return waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-2.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                          >
                            <WhatsAppIcon className="size-3.5" />
                            WhatsApp
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-muted-foreground max-w-xs">
                      <p className="line-clamp-3 whitespace-pre-line">
                        {lead.message ?? <span className="italic">Sin mensaje</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {SOURCE_LABELS[lead.source]}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusSelect leadId={lead.id} current={lead.status} readOnly={readOnlyControls} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <AssigneeSelect
                        leadId={lead.id}
                        current={lead.assignee?.id ?? null}
                        asesores={asesores}
                        readOnly={readOnlyControls}
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-muted-foreground whitespace-nowrap">
                      {dateFormatter.format(new Date(lead.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-gray-100 md:hidden">
            {leads.map((lead) => (
              <li key={lead.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-centa-black">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(lead.createdAt))} · {SOURCE_LABELS[lead.source]}
                    </p>
                  </div>
                  <StatusSelect leadId={lead.id} current={lead.status} readOnly={readOnlyControls} />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {lead.email && <p>{lead.email}</p>}
                  {lead.phone && <p>{lead.phone}</p>}
                </div>
                {lead.phone &&
                  (() => {
                    const waUrl = buildLeadWhatsAppUrl(
                      lead.phone,
                      buildAdvisorLeadMessage({ name: lead.name, property: lead.property }),
                    );
                    return waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-2.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                      >
                        <WhatsAppIcon className="size-3.5" />
                        Contactar por WhatsApp
                      </a>
                    ) : null;
                  })()}
                {lead.message && (
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">
                    {lead.message}
                  </p>
                )}
                <AssigneeSelect
                  leadId={lead.id}
                  current={lead.assignee?.id ?? null}
                  asesores={asesores}
                  readOnly={readOnlyControls}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
