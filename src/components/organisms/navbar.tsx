"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, Phone, LayoutDashboard } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ContactDialog } from "@/components/molecules/contact-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/session-token";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/emprendimientos", label: "Emprendimientos" },
  { href: "/quienes-somos", label: "Quiénes Somos" },
];

type SessionUser = SessionPayload;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileContactOpen, setMobileContactOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { signal: controller.signal, credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user: SessionUser } | null) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {
        /* anonymous or aborted — keep default state */
      });
    return () => controller.abort();
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-centa-green-1/95 shadow-lg backdrop-blur-md" : "bg-centa-green-1"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/assets/Centa-sin-bajada.png"
            alt="CENTA Propiedades"
            width={160}
            height={48}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-white/80 transition-all duration-200 hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-centa-green-3 after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-white/80 hover:text-white hover:bg-white/10 hover:-translate-y-0.5 active:!translate-y-0.5 transition-[transform,background-color] duration-200",
              )}
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          ) : null}
          <ContactDialog />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex items-center justify-center rounded-md p-2 text-white md:hidden"
            aria-label="Abrir menú"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-centa-green-1 border-centa-green-2 p-6">
            <nav className="mt-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-left text-lg font-medium text-white/80 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "justify-start text-lg font-medium text-white/80 hover:text-white hover:bg-white/10 hover:-translate-y-0.5 active:!translate-y-0.5 transition-[transform,background-color] duration-200 px-0 border-t border-white/10 pt-4",
                  )}
                >
                  <LayoutDashboard className="size-5" />
                  Dashboard
                </Link>
              ) : null}
              <Button
                size="lg"
                onClick={() => {
                  setOpen(false);
                  setMobileContactOpen(true);
                }}
                className="mt-2 w-full !bg-centa-green-1 text-white font-semibold hover:!bg-centa-green-1/90 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(0,58,42,0.5)] active:!translate-y-0.5 active:shadow-sm transition-[transform,box-shadow,background-color] duration-200"
              >
                <Phone className="mr-1.5 size-4" aria-hidden="true" />
                Contactanos
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
        <ContactDialog
          open={mobileContactOpen}
          onOpenChange={setMobileContactOpen}
          showTrigger={false}
        />
      </div>
    </header>
  );
}
