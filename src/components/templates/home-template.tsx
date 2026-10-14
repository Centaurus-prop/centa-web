import { Hero } from "@/components/organisms/hero";
import { ServicesSection } from "@/components/organisms/services-section";
import { PropertyGrid } from "@/components/organisms/property-grid";
import { CTASection } from "@/components/organisms/cta-section";
import { AnimateOnScroll } from "@/components/atoms/animate-on-scroll";
import { FeaturedDevelopmentsCarousel } from "@/components/molecules/featured-developments-carousel";
import type { DevelopmentGroup } from "@/lib/properties";
import type { Property } from "@/types/property";

interface HomeTemplateProps {
  featuredProperties: Property[];
  featuredDevelopments: DevelopmentGroup[];
}

export function HomeTemplate({ featuredProperties, featuredDevelopments }: HomeTemplateProps) {
  return (
    <>
      <Hero />
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="section-eyebrow">Lanzamientos y oportunidades</p>
                <h2 className="section-title">Emprendimientos destacados</h2>
              </div>
            </div>
          </AnimateOnScroll>

          <FeaturedDevelopmentsCarousel groups={featuredDevelopments} />
        </div>
      </section>
      <PropertyGrid properties={featuredProperties} />
      <ServicesSection />
      <CTASection />
    </>
  );
}
