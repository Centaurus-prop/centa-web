import { notFound } from "next/navigation";
import { CustomDevelopmentDetailTemplate } from "@/components/templates/custom-development-detail-template";
import { DevelopmentDetailTemplate } from "@/components/templates/development-detail-template";
import { getDevelopmentBySlug } from "@/lib/developments";
import { getDevelopmentGroupByName } from "@/lib/properties";

export default async function EmprendimientoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const customDevelopment = await getDevelopmentBySlug(decodedSlug);
  if (customDevelopment) {
    return <CustomDevelopmentDetailTemplate development={customDevelopment} />;
  }

  const group = await getDevelopmentGroupByName(decodedSlug);

  if (!group) notFound();

  return <DevelopmentDetailTemplate group={group} />;
}
