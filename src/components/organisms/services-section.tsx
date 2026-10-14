import { AnimateOnScroll } from "@/components/atoms/animate-on-scroll";
import { ServiceCard } from "@/components/molecules/service-card";
import { Building2, FileSearch, TrendingUp } from "lucide-react";

const services = [
  {
    icon: Building2,
    title: "Compra y Venta",
    description:
      "Te asesoramos en la compra o venta de tu propiedad con transparencia y profesionalismo en cada etapa.",
  },
  {
    icon: FileSearch,
    title: "Tasaciones",
    description:
      "Valuaciones precisas basadas en análisis de mercado actualizados para que tomes decisiones informadas.",
  },
  {
    icon: TrendingUp,
    title: "Inversiones",
    description:
      "Identificamos oportunidades de inversión inmobiliaria con proyección a largo plazo y retorno sostenido.",
  },
];

export function ServicesSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-centa-green-2">
              Nuestros servicios
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-centa-black sm:text-4xl">
              Todo lo que necesitás en un solo lugar
            </h2>
          </div>
        </AnimateOnScroll>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <AnimateOnScroll key={service.title} delay={i * 100} className="h-full">
              <ServiceCard {...service} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
