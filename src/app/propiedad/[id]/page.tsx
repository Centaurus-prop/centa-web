import { notFound } from "next/navigation";
import { PropertyDetailTemplate } from "@/components/templates/property-detail-template";
import { getPropertyById, getRelatedProperties } from "@/lib/properties";

export default async function PropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  const related = await getRelatedProperties(property);

  return <PropertyDetailTemplate property={property} related={related} />;
}
