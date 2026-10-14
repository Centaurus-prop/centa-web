import type { LucideIcon } from "lucide-react";

import { elevatedSurfaceClassName } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function ServiceCard({ icon: Icon, title, description, className }: ServiceCardProps) {
  return (
    <div
      className={cn(
        `${elevatedSurfaceClassName} group h-full p-6`,
        "hover:shadow-md",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-centa-green-1/10 transition-transform duration-200 group-hover:scale-110">
        <Icon className="size-6 text-centa-green-1" />
      </div>
      <h3 className="text-lg font-semibold text-centa-black">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
