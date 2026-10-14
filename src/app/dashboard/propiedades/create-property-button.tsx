"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateLocalPropertyForm } from "./create-local-property-form";

export function CreatePropertyButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-centa-green-1 px-3 text-sm font-medium text-white transition-colors hover:bg-centa-green-1/90"
          />
        }
      >
        <Plus className="size-4" />
        Agregar Propiedad
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crear propiedad o desarrollo local</DialogTitle>
        </DialogHeader>
        <CreateLocalPropertyForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
