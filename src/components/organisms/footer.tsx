import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-centa-green-1 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Image
              src="/assets/Centa-sin-bajada.png"
              alt="CENTA Propiedades"
              width={140}
              height={48}
              className="h-14 w-auto"
            />
            <p className="max-w-[12rem] text-sm leading-relaxed text-white/70">
              Decisiones inmobiliarias pensadas a largo plazo.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Navegación
            </h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-white/70 transition-colors hover:text-white">
                Inicio
              </Link>
              <Link href="/catalogo" className="text-sm text-white/70 transition-colors hover:text-white">
                Catálogo
              </Link>
              <Link href="/emprendimientos" className="text-sm text-white/70 transition-colors hover:text-white">
                Emprendimientos
              </Link>
              <Link href="/quienes-somos" className="text-sm text-white/70 transition-colors hover:text-white">
                Quiénes Somos
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Servicios
            </h3>
            <nav className="flex flex-col gap-2">
              <span className="text-sm text-white/70">Compra y venta</span>
              <span className="text-sm text-white/70">Tasaciones</span>
              <span className="text-sm text-white/70">Asesoramiento</span>
              <span className="text-sm text-white/70">Inversiones</span>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Contacto
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-centa-green-3" />
                <span className="text-sm text-white/70">Leandro N. Alem 855</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-centa-green-3" />
                <span className="text-sm text-white/70">+ 54 9 11 2883 5021</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-centa-green-3" />
                <span className="text-sm text-white/70">Consultas@centapropiedades.com</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-white/10" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} CENTA. Todos los derechos reservados. CENTA propiedades es una unidad de negocios independiente. No es una entidad regulada por la CNV.
          </p>
          <Link href="/login" className="text-xs text-white/30 transition-colors hover:text-white/60">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </footer>
  );
}
