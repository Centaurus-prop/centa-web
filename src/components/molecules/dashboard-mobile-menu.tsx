"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DashboardNav } from "@/components/molecules/dashboard-nav";
import type { Role } from "@/lib/session-token";

interface DashboardMobileMenuProps {
  role: Role;
}

export function DashboardMobileMenu({ role }: DashboardMobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        type="button"
        aria-label="Abrir menú"
        className="inline-flex size-9 items-center justify-center rounded-md text-centa-black transition-colors hover:bg-centa-green-1/10 hover:text-centa-green-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-centa-green-1/30"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-3 text-lg font-bold text-centa-green-1">
            <Image
              src="/assets/Centa-icon.png"
              alt="CENTA"
              width={28}
              height={28}
            />
            Panel
          </SheetTitle>
        </SheetHeader>
        <DashboardNav role={role} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
