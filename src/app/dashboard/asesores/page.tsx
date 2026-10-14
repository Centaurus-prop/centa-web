import { Users, Mail } from "lucide-react";
import { PageHeader } from "@/components/atoms/page-header";
import { EmptyState } from "@/components/atoms/empty-state";
import { Badge } from "@/components/ui/badge";
import { getAsesoresStats } from "@/lib/leads";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  asesor: "Asesor",
  revisor: "Revisor",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function DashboardAsesoresPage() {
  const asesores = await getAsesoresStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asesores"
        description={`${asesores.length} usuario${asesores.length === 1 ? "" : "s"} con acceso al panel.`}
      />

      {asesores.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay asesores cargados"
          description="Cuando se den de alta usuarios con rol admin o asesor, aparecerán aquí con sus métricas."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {asesores.map((asesor) => {
            const initials = getInitials(asesor.name);
            const conversionPct = asesor.totalLeads > 0
              ? (asesor.convertidos / asesor.totalLeads) * 100
              : 0;

            return (
              <article
                key={asesor.id}
                className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-centa-green-1 text-base font-bold text-centa-green-3">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-centa-black truncate">{asesor.name}</p>
                      {!asesor.active && (
                        <Badge variant="outline" className="text-[10px]">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <Mail className="size-3" />
                      {asesor.email}
                    </p>
                    <Badge variant="secondary" className="mt-1.5 text-[10px]">
                      {ROLE_LABELS[asesor.role] ?? asesor.role}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-centa-black">{asesor.totalLeads}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">En progreso</p>
                    <p className="text-lg font-bold text-purple-600">{asesor.enProgreso}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cerrados</p>
                    <p className="text-lg font-bold text-centa-green-1">{asesor.convertidos}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tasa de conversión</span>
                    <span className="font-semibold text-centa-black">
                      {conversionPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full bg-centa-green-1 transition-all duration-500"
                      style={{ width: `${Math.min(conversionPct, 100)}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground pt-1">
                    {asesor.lastLoginAt
                      ? `Último ingreso: ${dateFormatter.format(new Date(asesor.lastLoginAt))}`
                      : "Sin ingresos registrados"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
