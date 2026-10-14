import Link from "next/link";
import {
  Building2,
  MessageSquare,
  Users,
  BarChart3,
  Home,
  ArrowRight,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/atoms/page-header";
import { getLeadKpis, getAsesoresStats } from "@/lib/leads";
import { getAllProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

interface StatCard {
  label: string;
  value: string | number;
  icon: typeof Building2;
  accent: string;
  href?: string;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [kpis, asesores, properties] = await Promise.all([
    getLeadKpis().catch(() => null),
    getAsesoresStats().catch(() => []),
    getAllProperties().catch(() => []),
  ]);

  const conversionLabel = kpis ? `${kpis.conversionRate.toFixed(1)}%` : "—";

  const stats: StatCard[] = [
    {
      label: "Propiedades publicadas",
      value: properties.length,
      icon: Building2,
      accent: "text-centa-green-1 bg-centa-green-1/10",
      href: "/dashboard/propiedades",
    },
    {
      label: "Consultas nuevas",
      value: kpis?.nuevos ?? 0,
      icon: MessageSquare,
      accent: "text-blue-600 bg-blue-50",
      href: "/dashboard/leads?status=nuevo",
    },
    {
      label: "Asesores activos",
      value: asesores.filter((a) => a.active && a.role !== "revisor").length,
      icon: Users,
      accent: "text-purple-600 bg-purple-50",
      href: "/dashboard/asesores",
    },
    {
      label: "Tasa de conversión",
      value: conversionLabel,
      icon: BarChart3,
      accent: "text-centa-green-3 bg-centa-green-3/10",
      href: "/dashboard/metricas",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bienvenido, ${session.name}`}
        description="Este es tu panel de gestión. Acá vas a poder administrar propiedades, consultas y más."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Card = (
            <div className="flex h-full items-center gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.accent}`}>
                <stat.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-centa-black leading-none">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>{Card}</Link>
          ) : (
            <div key={stat.label}>{Card}</div>
          );
        })}
      </div>

      <section>
        <h2 className="mb-4 text-base font-semibold text-centa-black">Acciones rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/dashboard/propiedades", label: "Ver propiedades", icon: Building2 },
            { href: "/dashboard/leads", label: "Ver consultas", icon: MessageSquare },
            { href: "/", label: "Ir al sitio público", icon: Home },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-3">
                <action.icon className="size-5 text-centa-green-1" />
                <span className="text-sm font-medium text-centa-black">{action.label}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
