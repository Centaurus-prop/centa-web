import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/atoms/page-header";
import { AdminUsersTable } from "./admin-users-table";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const rows = await db.query.users.findMany({
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      phone: true,
      lastLoginAt: true,
      mustChangePassword: true,
      createdAt: true,
    },
    orderBy: (u, { asc }) => [asc(u.createdAt)],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description={`${rows.length} usuario${rows.length === 1 ? "" : "s"} con acceso al sistema.`}
      />
      <AdminUsersTable users={rows} currentUserId={session.userId} />
    </div>
  );
}
