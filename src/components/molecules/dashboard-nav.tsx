"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Hammer,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessDashboardRoute } from "@/lib/dashboard-routes";
import type { Role } from "@/lib/session-token";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/dashboard/nuevo-desarrollo", label: "Nuevo desarrollo", icon: Hammer },
  { href: "/dashboard/leads", label: "Consultas", icon: MessageSquare },
  { href: "/dashboard/asesores", label: "Asesores", icon: Users },
  { href: "/dashboard/metricas", label: "Métricas", icon: BarChart3 },
  { href: "/dashboard/config", label: "Configuración", icon: Settings },
  { href: "/dashboard/admin", label: "Usuarios", icon: ShieldCheck },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

interface DashboardNavProps {
  role: Role;
  onNavigate?: () => void;
}

export function DashboardNav({ role, onNavigate }: DashboardNavProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => canAccessDashboardRoute(item.href, role));

  return (
    <nav className="flex-1 space-y-1 p-4">
      {visibleItems.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-centa-green-1 text-centa-green-3"
                : "text-muted-foreground hover:bg-centa-green-1/5 hover:text-centa-green-1",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
