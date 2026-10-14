import { badgeClassName } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";

export const categoryLabels: Record<Property["categoria"], string> = {
  "a-estrenar": "A Estrenar",
  usado: "Usado",
  emprendimiento: "Emprendimiento",
};

export const statusLabels: Record<Property["estado"], string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

const badgeBaseClassName = badgeClassName;

const categoryColors: Record<Property["categoria"], string> = {
  "a-estrenar": "border-accent/60 bg-accent text-accent-foreground",
  usado: "border-primary/15 bg-primary text-primary-foreground",
  emprendimiento:
    "min-h-7 h-7 border-none bg-centa-green-1 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm",
};

const statusColors: Record<Property["estado"], string> = {
  disponible: "border-primary/12 bg-primary/8 text-primary",
  reservado: "border-accent/50 bg-accent/35 text-foreground",
  vendido: "border-border bg-secondary text-muted-foreground",
};

interface CategoryBadgeProps {
  categoria: Property["categoria"];
  className?: string;
}

export function CategoryBadge({ categoria, className }: CategoryBadgeProps) {
  return (
    <span className={cn(badgeBaseClassName, categoryColors[categoria], className)}>
      {categoryLabels[categoria]}
    </span>
  );
}

interface StatusBadgeProps {
  estado: Property["estado"];
  className?: string;
}

export function StatusBadge({ estado, className }: StatusBadgeProps) {
  if (estado === "disponible") return null;

  return (
    <span className={cn(badgeBaseClassName, statusColors[estado], className)}>
      {statusLabels[estado]}
    </span>
  );
}

interface FeaturedBadgeProps {
  className?: string;
}

export function FeaturedBadge({ className }: FeaturedBadgeProps) {
  return (
    <span
      className={cn(
        `${badgeClassName} border-accent/60 bg-accent text-accent-foreground`,
        className
      )}
    >
      Destacada
    </span>
  );
}
