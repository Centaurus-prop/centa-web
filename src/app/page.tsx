import { HomeTemplate } from "@/components/templates/home-template";
import { getDevelopmentGroups, getFeaturedProperties } from "@/lib/properties";

export default async function Home() {
  const [featuredProperties, featuredDevelopments, allDevelopments] = await Promise.all([
    getFeaturedProperties(),
    getDevelopmentGroups(true),
    getDevelopmentGroups(),
  ]);
  const displayDevelopments = featuredDevelopments.length > 0 ? featuredDevelopments : allDevelopments.slice(0, 4);

  return (
    <HomeTemplate
      featuredProperties={featuredProperties}
      featuredDevelopments={displayDevelopments}
    />
  );
}
