"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] error boundary", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-centa-black">Algo salió mal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No pudimos cargar esta sección. Probá de nuevo en unos segundos.
          </p>
        </div>
        <Button onClick={reset} className="bg-centa-green-1 text-white hover:bg-centa-green-2">
          <RotateCw className="size-4 mr-2" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}
