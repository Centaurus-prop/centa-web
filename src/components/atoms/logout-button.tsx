"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const busy = pending || submitting;

  async function handleLogout() {
    if (busy) return;
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // even on network error, clear client state and route to login
    } finally {
      setSubmitting(false);
      startTransition(() => {
        router.push("/login");
        router.refresh();
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={busy}
      className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
    </button>
  );
}
