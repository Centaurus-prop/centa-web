import { Settings, Mail, User, Database, KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/atoms/page-header";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  asesor: "Asesor",
  revisor: "Revisor",
};

interface SettingRowProps {
  label: string;
  value: React.ReactNode;
  icon: typeof Settings;
  hint?: string;
}

function SettingRow({ label, value, icon: Icon, hint }: SettingRowProps) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-gray-100 bg-gray-50/40 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-centa-green-1 ring-1 ring-black/[0.04]">
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm font-medium text-centa-black">{value}</div>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export default async function DashboardConfigPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tokkoConfigured = Boolean(process.env.TOKKO_API_KEY?.trim());
  const dbConfigured = Boolean(
    process.env.DATABASE_URL ||
      process.env.CENTA_DATABASE_DATABASE_URL ||
      process.env.POSTGRES_URL,
  );
  const authSecretConfigured = Boolean(process.env.AUTH_SECRET);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos de tu cuenta y estado de la plataforma."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-centa-black uppercase tracking-wide">
          Tu cuenta
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <SettingRow
            icon={User}
            label="Nombre"
            value={session.name}
          />
          <SettingRow
            icon={Mail}
            label="Email"
            value={session.email}
          />
          <SettingRow
            icon={KeyRound}
            label="Rol"
            value={
              <Badge variant="secondary" className="text-xs">
                {ROLE_LABELS[session.role] ?? session.role}
              </Badge>
            }
            hint="El rol determina las secciones a las que tenés acceso."
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-centa-black uppercase tracking-wide">
          Estado de integraciones
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <SettingRow
            icon={Database}
            label="Base de datos"
            value={
              <Badge variant={dbConfigured ? "secondary" : "destructive"} className="text-xs">
                {dbConfigured ? "Conectada" : "No configurada"}
              </Badge>
            }
            hint="DATABASE_URL / POSTGRES_URL"
          />
          <SettingRow
            icon={Settings}
            label="Tokko Broker"
            value={
              <Badge variant={tokkoConfigured ? "secondary" : "outline"} className="text-xs">
                {tokkoConfigured ? "Conectado" : "Usando datos mock"}
              </Badge>
            }
            hint="TOKKO_API_KEY"
          />
          <SettingRow
            icon={KeyRound}
            label="Sesión JWT"
            value={
              <Badge variant={authSecretConfigured ? "secondary" : "outline"} className="text-xs">
                {authSecretConfigured ? "Configurada" : "Usando secret derivado"}
              </Badge>
            }
            hint="AUTH_SECRET"
          />
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
        <h2 className="text-base font-semibold text-centa-black">Próximas opciones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La administración de usuarios, plantillas de email y preferencias del equipo se van a
          habilitar en próximas iteraciones. Si necesitás un cambio puntual mientras tanto,
          contactá al administrador.
        </p>
      </section>
    </div>
  );
}
