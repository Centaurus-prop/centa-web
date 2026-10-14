"use client";

import { useId, useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/molecules/contact-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { accentGlowClassName } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { WHATSAPP_PHONE } from "@/lib/whatsapp";

interface ContactDialogProps {
  label?: string;
  className?: string;
  size?: "default" | "lg";
  defaultMessage?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function ContactDialog({
  label = "Contactanos",
  className,
  size = "lg",
  defaultMessage = "Hola, quiero recibir asesoramiento sobre propiedades.",
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: ContactDialogProps) {
  const generatedId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const idPrefix = `general-contact-${generatedId.replace(/:/g, "")}`;

  function handleOpenChange(nextOpen: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger
          className={cn(
            buttonVariants({ size }),
            `!bg-centa-green-3 text-centa-black font-semibold hover:!bg-centa-green-3/90 ${accentGlowClassName}`,
            "active:!translate-y-0.5 active:shadow-sm transition-[transform,box-shadow,background-color] duration-200",
            className,
          )}
        >
          <Phone className="mr-1.5 size-4" aria-hidden="true" />
          {label}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 inline-flex size-11 items-center justify-center rounded-full bg-centa-green-3/15 text-centa-green-1">
            <Phone className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Contactanos</DialogTitle>
          <DialogDescription>
            Dejanos tus datos y un asesor de CENTA se va a comunicar para ayudarte con tu consulta.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ContactForm
            idPrefix={idPrefix}
            defaultMessage={defaultMessage}
            onSuccess={() => handleOpenChange(false)}
          />
        )}
        <a
          href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(defaultMessage)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-centa-success)] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0.5"
        >
          <MessageCircle className="size-4" />
          Escribinos por WhatsApp
        </a>
      </DialogContent>
    </Dialog>
  );
}
