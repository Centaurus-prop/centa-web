import type { ReactNode } from "react";
import Image from "next/image";
import { LogoutButton } from "@/components/atoms/logout-button";
import { DashboardNav } from "@/components/molecules/dashboard-nav";
import { DashboardMobileMenu } from "@/components/molecules/dashboard-mobile-menu";
import { getInitials } from "@/lib/utils";
import type { SessionPayload } from "@/lib/session-token";

interface DashboardShellProps {
  user: SessionPayload;
  children: ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const initials = getInitials(user.name);

  return (
    <div className="flex min-h-screen bg-centa-off-white">
      <aside className="hidden w-64 flex-shrink-0 border-r bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <Image
              src="/assets/Centa-icon.png"
              alt="CENTA"
              width={32}
              height={32}
              className="size-8"
            />
            <span className="text-lg font-bold text-centa-green-1">Panel</span>
          </div>

          <DashboardNav role={user.role} />

          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-centa-green-1 text-sm font-bold text-centa-green-3">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-centa-black">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b bg-white px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <DashboardMobileMenu role={user.role} />
            <Image
              src="/assets/Centa-icon.png"
              alt="CENTA"
              width={28}
              height={28}
            />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-sm font-medium text-centa-black">{user.name}</span>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
