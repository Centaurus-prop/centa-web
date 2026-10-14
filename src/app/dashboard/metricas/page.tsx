import { BarChart3, MessageSquare, Building2, TrendingUp, Calendar } from "lucide-react";
import { PageHeader } from "@/components/atoms/page-header";
import { EmptyState } from "@/components/atoms/empty-state";
import { getLeadKpis, type LeadSource } from "@/lib/leads";
import { getAllProperties } from "@/lib/properties";
import { SOURCE_LABELS } from "@/lib/lead-labels";

export const dynamic = "force-dynamic";

const SOURCE_COLORS: Record<LeadSource, string> = {
  web: "bg-centa-green-1",
  tokko: "bg-blue-500",
  whatsapp: "bg-emerald-500",
  manual: "bg-amber-500",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof BarChart3;
  accent: string;
}

function KpiCard({ label, value, hint, icon: Icon, accent }: KpiCardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-centa-black">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardMetricasPage() {
  const [kpis, properties] = await Promise.all([
    getLeadKpis().catch(() => null),
    getAllProperties().catch(() => []),
  ]);

  if (!kpis) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Métricas"
          description="KPIs operativos de tu inmobiliaria."
        />
        <EmptyState
          icon={BarChart3}
          title="Métricas no disponibles"
          description="No pudimos cargar las métricas. Verificá la conexión con la base de datos."
        />
      </div>
    );
  }

  const totalSources = Object.values(kpis.bySource).reduce((sum, v) => sum + v, 0);
  const sourceEntries = (Object.entries(kpis.bySource) as [LeadSource, number][])
    .sort((a, b) => b[1] - a[1]);

  const propertiesByCategory = properties.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoria] = (acc[p.categoria] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Métricas"
        description="KPIs operativos de leads y propiedades."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Consultas totales"
          value={kpis.total}
          hint="Todos los tiempos"
          icon={MessageSquare}
          accent="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="Últimos 7 días"
          value={kpis.last7Days}
          hint="Consultas recientes"
          icon={Calendar}
          accent="bg-purple-50 text-purple-600"
        />
        <KpiCard
          label="Tasa de conversión"
          value={`${kpis.conversionRate.toFixed(1)}%`}
          hint={`${kpis.convertidos} convertidos`}
          icon={TrendingUp}
          accent="bg-centa-green-3/20 text-centa-green-1"
        />
        <KpiCard
          label="Propiedades activas"
          value={properties.filter((p) => p.estado === "disponible").length}
          hint={`de ${properties.length} totales`}
          icon={Building2}
          accent="bg-centa-green-1/10 text-centa-green-1"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/[0.04]">
          <h2 className="text-base font-semibold text-centa-black">Embudo de consultas</h2>
          <p className="text-xs text-muted-foreground mb-4">Distribución por estado actual.</p>
          <div className="space-y-3">
            {[
              { label: "Nuevas", value: kpis.nuevos, color: "bg-blue-500" },
              { label: "En progreso", value: kpis.enProgreso, color: "bg-purple-500" },
              { label: "Convertidas", value: kpis.convertidos, color: "bg-centa-green-1" },
              { label: "Descartadas", value: kpis.descartados, color: "bg-gray-400" },
            ].map((row) => {
              const pct = kpis.total > 0 ? (row.value / kpis.total) * 100 : 0;
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-centa-black">{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.value} <span className="opacity-60">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full ${row.color} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/[0.04]">
          <h2 className="text-base font-semibold text-centa-black">Origen de las consultas</h2>
          <p className="text-xs text-muted-foreground mb-4">Distribución por fuente.</p>
          {totalSources === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay consultas registradas.</p>
          ) : (
            <div className="space-y-3">
              {sourceEntries.map(([source, count]) => {
                const pct = totalSources > 0 ? (count / totalSources) * 100 : 0;
                return (
                  <div key={source}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-centa-black">{SOURCE_LABELS[source]}</span>
                      <span className="text-muted-foreground">
                        {count} <span className="opacity-60">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full ${SOURCE_COLORS[source]} transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/[0.04]">
        <h2 className="text-base font-semibold text-centa-black">Propiedades por categoría</h2>
        <p className="text-xs text-muted-foreground mb-4">Composición del catálogo.</p>
        {Object.keys(propertiesByCategory).length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay propiedades cargadas.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(propertiesByCategory).map(([category, count]) => (
              <div key={category} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {category === "a-estrenar" ? "A estrenar" : category === "usado" ? "Usado" : "Emprendimiento"}
                </p>
                <p className="mt-1 text-xl font-bold text-centa-black">{count}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
