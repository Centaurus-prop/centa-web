import type { Role } from "./session-token";

export interface DashboardRouteRule {
  path: string;
  allowedRoles: readonly Role[];
}

export const DASHBOARD_ROUTE_RULES: readonly DashboardRouteRule[] = [
  { path: "/dashboard/admin", allowedRoles: ["admin"] },
  { path: "/dashboard/asesores", allowedRoles: ["admin", "asesor"] },
  { path: "/dashboard/nuevo-desarrollo", allowedRoles: ["admin", "asesor"] },
  { path: "/dashboard/config", allowedRoles: ["admin"] },
];

export function findRouteRule(pathname: string): DashboardRouteRule | undefined {
  return DASHBOARD_ROUTE_RULES.find(
    (rule) => pathname === rule.path || pathname.startsWith(`${rule.path}/`),
  );
}

export function canAccessDashboardRoute(pathname: string, role: Role): boolean {
  const rule = findRouteRule(pathname);
  if (!rule) return true;
  return rule.allowedRoles.includes(role);
}
