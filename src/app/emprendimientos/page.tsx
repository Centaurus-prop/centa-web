import { DevelopmentsTemplate } from "@/components/templates/developments-template";
import { getPublishedDevelopments } from "@/lib/developments";
import { getDevelopmentGroups } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function EmprendimientosPage() {
  const [disponibles, proximamente] = await Promise.all([
    getDevelopmentGroups(),
    getPublishedDevelopments(),
  ]);

  return <DevelopmentsTemplate disponibles={disponibles} proximamente={proximamente} />;
}
