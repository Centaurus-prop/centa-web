import { CatalogTemplate } from "@/components/templates/catalog-template";
import { getAllProperties } from "@/lib/properties";

export default async function CatalogoPage() {
  const properties = await getAllProperties();
  return <CatalogTemplate properties={properties} />;
}
