import { Shield, Target, Users, Eye } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Confianza",
    description:
      "Cada operación se realiza con total transparencia. Nuestros clientes saben exactamente qué esperar en cada etapa.",
  },
  {
    icon: Target,
    title: "Claridad",
    description:
      "Comunicación directa y sin vueltas. Presentamos la información de manera estructurada para facilitar tus decisiones.",
  },
  {
    icon: Eye,
    title: "Visión a largo plazo",
    description:
      "No pensamos en la transacción del momento, sino en el impacto que cada decisión tiene en tu futuro patrimonial.",
  },
  {
    icon: Users,
    title: "Cercanía",
    description:
      "Somos un equipo accesible y comprometido. Nos involucramos personalmente en cada operación.",
  },
];

const team = [
  {
    name: "Martín Álvarez",
    role: "Director General",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
  {
    name: "Lucía Fernández",
    role: "Directora Comercial",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
  },
  {
    name: "Santiago Romero",
    role: "Asesor Senior",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  },
  {
    name: "Valentina Torres",
    role: "Coordinadora de Operaciones",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
  },
];

export default function QuienesSomosPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-centa-green-1 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-centa-green-3">
            Quiénes Somos
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Estructura y confianza en cada decisión
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            CENTA nació con un objetivo claro: transformar la experiencia
            inmobiliaria en Argentina a través de profesionalismo, transparencia
            y una mirada estratégica a largo plazo.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-centa-black">
              Nuestra historia
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                Fundada en Buenos Aires, CENTA surge de la convicción de que el
                mercado inmobiliario necesita un enfoque diferente. Un enfoque
                donde la claridad en la información, la estructura en los
                procesos y la confianza en el vínculo profesional sean los
                pilares fundamentales.
              </p>
              <p>
                Con años de experiencia en el sector, nuestro equipo combina
                conocimiento técnico del mercado con una atención personalizada
                que pone al cliente en el centro de cada decisión. No buscamos
                cerrar operaciones rápidas, sino construir relaciones duraderas.
              </p>
              <p>
                Hoy, CENTA se posiciona como un referente para quienes buscan
                tomar decisiones inmobiliarias informadas, pensadas y con
                proyección a futuro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-centa-green-2">
              Lo que nos define
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-centa-black sm:text-4xl">
              Nuestros valores
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-centa-green-1/10">
                  <value.icon className="size-7 text-centa-green-1" />
                </div>
                <h3 className="text-lg font-semibold text-centa-black">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team — ocultado temporalmente (TEN-190). Reactivar quitando el `false &&`. */}
      {false && (
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-centa-green-2">
              El equipo
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-centa-black sm:text-4xl">
              Profesionales comprometidos
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div
                key={member.name}
                className="surface-panel group overflow-hidden rounded-xl transition-shadow hover:shadow-md"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-centa-black">
                    {member.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}
    </>
  );
}
