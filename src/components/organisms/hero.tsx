import Link from "next/link";
import { accentGlowClassName } from "@/lib/theme";

export function Hero() {
  return (
    <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden lg:min-h-[600px]">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/assets/hero-bg.jpg')",
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-centa-green-1/80" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="mx-auto max-w-3xl animate-fade-up text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl [animation-delay:200ms]">
          Decisiones inmobiliarias pensadas a largo plazo
        </h1>
        <p className="mx-auto mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-white/80 [animation-delay:300ms]">
          Te acompañamos en cada paso del proceso inmobiliario con claridad,
          estructura y la confianza que necesitás para tomar la mejor decisión.
        </p>
        <div className="mt-10 flex animate-fade-up flex-col items-center gap-4 [animation-delay:400ms]">
          <div className="flex flex-row flex-wrap items-center justify-center gap-4">
            <Link
              href="/catalogo"
              className={`inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-centa-green-3 px-8 text-base font-semibold text-centa-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-centa-green-3/90 active:translate-y-px active:shadow-sm ${accentGlowClassName}`}
            >
              Ver propiedades
            </Link>
            <Link
              href="/emprendimientos"
              className="cta-secondary-inverse h-12 gap-1.5 px-8 text-base"
            >
              Ver emprendimientos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
