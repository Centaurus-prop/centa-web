"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ChangePasswordForm() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json() as { ok?: boolean; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Error al cambiar la contraseña");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="newPassword" className="text-sm font-medium text-centa-black">
          Nueva contraseña
        </label>
        <input
          id="newPassword"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-centa-green-2"
          placeholder="Mín. 8 caracteres, mayúscula, minúscula y número"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirm" className="text-sm font-medium text-centa-black">
          Confirmar contraseña
        </label>
        <input
          id="confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-centa-green-2"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-centa-green-2 hover:bg-centa-green-1 text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
