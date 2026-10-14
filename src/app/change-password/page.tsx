import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.mustChangePassword) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-centa-off-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-centa-green-1 mb-2">
          ¡Bienvenido!
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Como es tu primer ingreso, cambiá la contraseña.
        </p>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
