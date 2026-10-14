import Link from "next/link";
import { AnimateOnScroll } from "@/components/atoms/animate-on-scroll";
import { ContactDialog } from "@/components/molecules/contact-dialog";

export function CTASection() {
  return (
    <section className="bg-centa-green-1 py-20">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            ¿Listo para dar el próximo paso?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Contactanos hoy y empezá a planificar tu próxima inversión
            inmobiliaria con el respaldo de profesionales.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ContactDialog
              label="Agendar una consulta"
              className="h-12 px-8 text-base"
              defaultMessage="Hola, quiero agendar una consulta con CENTA."
            />
            <Link
              href="/emprendimientos"
              className="cta-secondary-inverse h-12 px-8 text-base"
            >
              Explorar emprendimientos
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
