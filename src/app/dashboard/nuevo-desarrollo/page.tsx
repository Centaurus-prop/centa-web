import { PageHeader } from "@/components/atoms/page-header";
import { getAllDevelopments, getDevelopmentById } from "@/lib/developments";
import { getDevelopmentGroups } from "@/lib/properties";

import { CreateDevelopmentForm } from "./create-development-form";
import { DevelopmentList } from "./development-list";

export default async function NewDevelopmentPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const [developments, selectedDevelopment, tokkoGroups] = await Promise.all([
    getAllDevelopments(),
    params?.id ? getDevelopmentById(params.id) : Promise.resolve(null),
    getDevelopmentGroups(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo desarrollo"
        description="Agregá un próximo emprendimiento con toda la información."
      />

      <div className="w-full space-y-8">
        <CreateDevelopmentForm development={selectedDevelopment} />
        <DevelopmentList properties={developments} tokkoGroups={tokkoGroups} />
      </div>
    </div>
  );
}
