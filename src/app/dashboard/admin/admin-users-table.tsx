"use client";

import { useState, useTransition, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";
import { Plus, Pencil, RotateCcw, Copy, Check, UserCheck, UserX } from "lucide-react";
import {
  createUserAction,
  editUserAction,
  resetPasswordAction,
  toggleActiveAction,
} from "./actions";
import type { Role } from "@/lib/session-token";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  phone: string | null;
  lastLoginAt: Date | string | null;
  mustChangePassword: boolean;
  createdAt: Date | string;
}

interface AdminUsersTableProps {
  users: AdminUser[];
  currentUserId: string;
}

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  asesor: "Asesor",
  revisor: "Revisor",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  try {
    return dateFormatter.format(new Date(d as string));
  } catch {
    return "—";
  }
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-centa-green-2 focus:border-centa-green-2 disabled:opacity-50 bg-white";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-sm font-medium text-centa-green-1 hover:text-centa-green-2 transition-colors"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function TempPasswordDisplay({
  tempPassword,
  label,
  onClose,
}: {
  tempPassword: string;
  label: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-centa-off-white px-4 py-3">
        <span className="font-mono text-lg font-bold tracking-widest text-centa-green-1">
          {tempPassword}
        </span>
        <CopyButton text={tempPassword} />
      </div>
      <Button onClick={onClose} className="w-full">
        Entendido
      </Button>
    </div>
  );
}

function UserFormFields({
  mode,
  defaultValues,
  isSelf,
}: {
  mode: "create" | "edit";
  defaultValues?: AdminUser;
  isSelf: boolean;
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-centa-black">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className={inputCls}
        />
      </div>

      {mode === "create" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-centa-black">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputCls}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-medium text-centa-black">
          Rol
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue={defaultValues?.role ?? "asesor"}
          disabled={isSelf}
          className={inputCls}
        >
          <option value="admin">Admin</option>
          <option value="asesor">Asesor</option>
          <option value="revisor">Revisor</option>
        </select>
        {isSelf && (
          <p className="text-xs text-muted-foreground">No podés cambiar tu propio rol.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-centa-black">
          Teléfono{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone ?? ""}
          className={inputCls}
        />
      </div>
    </>
  );
}

type DialogState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; user: AdminUser }
  | { kind: "reset-confirm"; user: AdminUser }
  | { kind: "temp-password"; tempPassword: string; action: "created" | "reset" };

export function AdminUsersTable({ users, currentUserId }: AdminUsersTableProps) {
  const [dlg, setDlg] = useState<DialogState>({ kind: "closed" });
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [toggleErrors, setToggleErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const isOpen = dlg.kind !== "closed";

  function closeDialog() {
    setDlg({ kind: "closed" });
    setFormError(null);
  }

  function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFormError(null);
    startTransition(async () => {
      const result = await createUserAction(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setDlg({ kind: "temp-password", tempPassword: result.data.temporaryPassword, action: "created" });
    });
  }

  function handleEditSubmit(user: AdminUser) {
    return function (e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      setFormError(null);
      startTransition(async () => {
        const result = await editUserAction(user.id, formData);
        if (!result.ok) {
          setFormError(result.error);
          return;
        }
        closeDialog();
      });
    };
  }

  function handleResetConfirm(user: AdminUser) {
    startTransition(async () => {
      const result = await resetPasswordAction(user.id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setDlg({ kind: "temp-password", tempPassword: result.data.temporaryPassword, action: "reset" });
    });
  }

  function handleToggleActive(user: AdminUser) {
    startTransition(async () => {
      const result = await toggleActiveAction(user.id, !user.active);
      if (!result.ok) {
        setToggleErrors((prev) => ({ ...prev, [user.id]: result.error }));
        setTimeout(() => setToggleErrors((prev) => { const n = { ...prev }; delete n[user.id]; return n; }), 4000);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setDlg({ kind: "create" })}
          disabled={isPending}
          size="sm"
          className="gap-1.5"
        >
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Mobile cards / Desktop table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04] overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-centa-off-white/60 text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Último ingreso</th>
                <th className="px-4 py-3 font-medium sr-only">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-centa-off-white/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-centa-green-1 text-xs font-bold text-centa-green-3">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-centa-black">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.mustChangePassword && (
                          <span className="text-[10px] text-amber-600 font-medium">Debe cambiar contraseña</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.active ? (
                      <Badge className="bg-centa-green-1/10 text-centa-green-1 hover:bg-centa-green-1/10">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactivo
                      </Badge>
                    )}
                    {toggleErrors[user.id] && (
                      <p className="text-[10px] text-red-600 mt-0.5">{toggleErrors[user.id]}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setDlg({ kind: "edit", user })}
                        disabled={isPending}
                        title="Editar usuario"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-centa-green-1/10 hover:text-centa-green-1 transition-colors disabled:opacity-40"
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDlg({ kind: "reset-confirm", user })}
                        disabled={isPending}
                        title="Resetear contraseña"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-40"
                      >
                        <RotateCcw className="size-3.5" />
                        <span className="sr-only">Resetear contraseña</span>
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          disabled={isPending}
                          title={user.active ? "Desactivar usuario" : "Activar usuario"}
                          className={`rounded-lg p-1.5 transition-colors disabled:opacity-40 ${
                            user.active
                              ? "text-muted-foreground hover:bg-red-50 hover:text-red-600"
                              : "text-muted-foreground hover:bg-centa-green-1/10 hover:text-centa-green-1"
                          }`}
                        >
                          {user.active ? (
                            <UserX className="size-3.5" />
                          ) : (
                            <UserCheck className="size-3.5" />
                          )}
                          <span className="sr-only">
                            {user.active ? "Desactivar" : "Activar"}
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {users.map((user) => (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-centa-green-1 text-sm font-bold text-centa-green-3">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-centa-black truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {user.mustChangePassword && (
                    <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                      Debe cambiar contraseña
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {ROLE_LABELS[user.role]}
                  </Badge>
                  {user.active ? (
                    <Badge className="text-[10px] bg-centa-green-1/10 text-centa-green-1 hover:bg-centa-green-1/10">
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Inactivo
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Último ingreso: {formatDate(user.lastLoginAt)}
              </p>

              {toggleErrors[user.id] && (
                <p className="text-xs text-red-600">{toggleErrors[user.id]}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDlg({ kind: "edit", user })}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-centa-black hover:bg-centa-green-1/5 transition-colors disabled:opacity-40"
                >
                  <Pencil className="size-3" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setDlg({ kind: "reset-confirm", user })}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-centa-black hover:bg-amber-50 hover:border-amber-200 transition-colors disabled:opacity-40"
                >
                  <RotateCcw className="size-3" />
                  Resetear clave
                </button>
                {user.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleToggleActive(user)}
                    disabled={isPending}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                      user.active
                        ? "border-gray-200 text-centa-black hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                        : "border-gray-200 text-centa-black hover:bg-centa-green-1/5"
                    }`}
                  >
                    {user.active ? (
                      <><UserX className="size-3" /> Desactivar</>
                    ) : (
                      <><UserCheck className="size-3" /> Activar</>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          {dlg.kind === "create" && (
            <>
              <DialogHeader>
                <DialogTitle>Nuevo usuario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                <UserFormFields mode="create" isSelf={false} />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Creando..." : "Crear usuario"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {dlg.kind === "edit" && (
            <>
              <DialogHeader>
                <DialogTitle>Editar usuario</DialogTitle>
              </DialogHeader>
              <form
                ref={formRef}
                onSubmit={handleEditSubmit(dlg.user)}
                className="flex flex-col gap-4"
              >
                <UserFormFields
                  mode="edit"
                  defaultValues={dlg.user}
                  isSelf={dlg.user.id === currentUserId}
                />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {dlg.kind === "reset-confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Resetear contraseña</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                ¿Querés resetear la contraseña de{" "}
                <strong className="text-centa-black">{dlg.user.name}</strong>? Se le
                asignará una contraseña temporal y deberá cambiarla en su próximo ingreso.
              </p>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <Button
                  variant="destructive"
                  onClick={() => handleResetConfirm(dlg.user)}
                  disabled={isPending}
                >
                  {isPending ? "Reseteando..." : "Resetear contraseña"}
                </Button>
              </div>
            </>
          )}

          {dlg.kind === "temp-password" && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dlg.action === "created" ? "Usuario creado" : "Contraseña reseteada"}
                </DialogTitle>
              </DialogHeader>
              <TempPasswordDisplay
                tempPassword={dlg.tempPassword}
                label={
                  dlg.action === "created"
                    ? "Compartí esta contraseña temporal con el usuario. Solo se muestra una vez."
                    : "La contraseña fue reseteada. Compartí esta contraseña temporal con el usuario. Solo se muestra una vez."
                }
                onClose={closeDialog}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
