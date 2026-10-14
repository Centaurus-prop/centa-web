"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { accentGlowClassName } from "@/lib/theme";
import { Lock, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("redirect");
  const redirect = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(data?.error ?? "Error al iniciar sesión");
        return;
      }

      // Full page reload to ensure navbar picks up the new session cookie
      window.location.href = redirect;
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-centa-black">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 border-[var(--color-centa-border-soft)] pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-centa-black">
              Contraseña
            </label>
            <Link href="#" className="text-xs text-centa-green-1 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 border-[var(--color-centa-border-soft)] pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-centa-green-1 transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className={`h-11 w-full bg-centa-green-1 text-base font-bold text-white hover:bg-centa-green-1/90 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none ${accentGlowClassName}`}
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      {/* Left — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-sm space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-centa-green-1 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-centa-black">Bienvenido</h1>
            <p className="text-muted-foreground">
              Ingresá a tu cuenta para acceder a tu panel.
            </p>
          </div>

          <Suspense fallback={<div className="h-40" />}>
            <LoginForm />
          </Suspense>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              o
            </span>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{" "}
            <Link href="#" className="font-semibold text-centa-green-1 hover:underline">
              Contactanos
            </Link>
          </p>
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center bg-centa-green-1 px-12 py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-centa-green-3" />
          <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-centa-green-3" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-sm">
          <Image src="/assets/Centa-sin-bajada.png" alt="CENTA" width={200} height={64} className="h-16 w-auto" />
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Decisiones inmobiliarias pensadas a largo plazo
            </h2>
            <p className="text-white/60 leading-relaxed">
              Accedé a tu panel para gestionar tus propiedades, consultas y seguimiento de operaciones.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/10 w-full">
            {[
              { value: "+200", label: "Propiedades" },
              { value: "+10", label: "Años de exp." },
              { value: "+500", label: "Clientes" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-centa-green-3">{value}</span>
                <span className="text-xs text-white/50">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
