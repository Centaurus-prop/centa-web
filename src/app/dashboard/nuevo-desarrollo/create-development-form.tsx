"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, JSX } from "react";
import { useRouter } from "next/navigation";
import { Loader2, GripVertical, Plus, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { createDevelopmentAction, updateDevelopmentAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Development } from "@/lib/developments";

interface ImageItem {
  id: string;
  url: string;
  preview?: string;
  uploadStatus?: "uploading" | "uploaded";
  source: "url" | "file";
}

interface DevelopmentFormValues {
  developmentName: string;
  ubicacion: string;
  direccion: string;
  descripcion: string;
  constructionDate: string;
  precio: string;
  moneda: string;
}

const initialState = {
  ok: false,
  message: "",
};

const MAX_UPLOAD_FILES = 10;

function getInitialFormValues(development?: Development | null): DevelopmentFormValues {
  return {
    developmentName: development?.name ?? "",
    ubicacion: development?.location ?? "",
    direccion: development?.address ?? "",
    descripcion: development?.description ?? "",
    constructionDate: development?.constructionDate ?? "",
    precio: development?.price ?? "",
    moneda: development?.currency ?? "USD",
  };
}

type PresignUpload = {
  key: string;
  url: string;
  publicUrl: string;
};

function SortableThumbnail({
  image,
  index,
  onDelete,
}: {
  image: ImageItem;
  index: number;
  onDelete: (id: string) => void;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.8 : 1,
      }}
      className="relative size-24 overflow-hidden rounded-2xl border border-centa-green-1/10 bg-white"
    >
      <button
        type="button"
        className="absolute top-1 left-1 z-10 rounded bg-white/85 p-1 text-centa-muted-1 hover:text-centa-black"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => onDelete(image.id)}
        className="absolute top-1 right-1 z-10 rounded bg-white/85 p-1 text-centa-muted-1 hover:text-red-600"
        aria-label="Eliminar imagen"
      >
        <X className="size-4" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.preview || image.url} alt={`Imagen ${index + 1}`} className="size-full object-cover" />

      {image.uploadStatus === "uploading" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : null}

      {index === 0 ? (
        <Badge className="absolute bottom-1 left-1 bg-centa-green-1 px-1.5 py-0 text-[0.55rem] text-white">
          Principal
        </Badge>
      ) : null}
    </div>
  );
}

export function CreateDevelopmentForm({ development }: { development?: Development | null }): JSX.Element {
  const router = useRouter();
  const isEditing = Boolean(development?.id);
  const [isDialogOpen, setIsDialogOpen] = useState(isEditing);
  const [state, action, isPending] = useActionState(
    isEditing ? updateDevelopmentAction : createDevelopmentAction,
    initialState,
  );
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [formValues, setFormValues] = useState<DevelopmentFormValues>(() => getInitialFormValues(development));
  const [amenitiesInput, setAmenitiesInput] = useState(development?.amenities.join(", ") ?? "");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hiddenImageInputRef = useRef<HTMLInputElement>(null);
  const hiddenAmenitiesInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const initialImages = useMemo(
    () =>
      (development?.images ?? []).map((image, index) => ({
        id: `${development?.id ?? "new"}-${index}-${image}`,
        url: image,
        preview: image,
        uploadStatus: "uploaded" as const,
        source: "url" as const,
      })),
    [development],
  );

  const syncHiddenField = useCallback((nextImages: ImageItem[]) => {
    if (hiddenImageInputRef.current) {
      hiddenImageInputRef.current.value = nextImages
        .filter((image) => image.uploadStatus !== "uploading")
        .map((image) => image.url)
        .filter(Boolean)
        .join("\n");
    }
  }, []);

  const syncAmenitiesField = useCallback((value: string) => {
    if (hiddenAmenitiesInputRef.current) {
      hiddenAmenitiesInputRef.current.value = value;
    }
  }, []);

  useEffect(() => {
    setImages(initialImages);
    syncHiddenField(initialImages);
  }, [initialImages, syncHiddenField]);

  useEffect(() => {
    setFormValues(getInitialFormValues(development));
    setAmenitiesInput(development?.amenities.join(", ") ?? "");
    setIsDialogOpen(Boolean(development?.id));
  }, [development]);

  const uploadFiles = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const tempImages: ImageItem[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      url: "",
      preview: URL.createObjectURL(file),
      uploadStatus: "uploading",
      source: "file",
    }));

    setImages((prev) => {
      const nextImages = [...prev, ...tempImages];
      syncHiddenField(nextImages);
      return nextImages;
    });
    setIsUploadingImages(true);

    try {
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: acceptedFiles.map((file) => ({ filename: file.name, contentType: file.type })),
        }),
      });

      const presignPayload = (await presignResponse.json().catch(() => null)) as
        | { uploads?: PresignUpload[]; error?: string }
        | null;

      if (!presignResponse.ok || !presignPayload?.uploads || presignPayload.uploads.length !== acceptedFiles.length) {
        throw new Error(presignPayload?.error || "No se pudieron preparar las imágenes.");
      }

      await Promise.all(
        acceptedFiles.map(async (file, index) => {
          const upload = presignPayload.uploads?.[index];
          if (!upload) {
            throw new Error("La preparación de subida devolvió datos incompletos.");
          }

          const uploadResponse = await fetch(upload.url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`No se pudo subir ${file.name}.`);
          }
        }),
      );

      setImages((prev) => {
        const uploadMap = new Map<string, PresignUpload>();
        tempImages.forEach((image, index) => {
          const upload = presignPayload.uploads?.[index];
          if (upload) uploadMap.set(image.id, upload);
        });

        const nextImages = prev.map((image) => {
          const upload = uploadMap.get(image.id);
          if (!upload) return image;

          if (image.preview?.startsWith("blob:")) {
            URL.revokeObjectURL(image.preview);
          }

          return {
            ...image,
            url: upload.publicUrl,
            preview: upload.publicUrl,
            uploadStatus: "uploaded" as const,
          };
        });

        syncHiddenField(nextImages);
        return nextImages;
      });
    } catch (error) {
      tempImages.forEach((image) => {
        if (image.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(image.preview);
        }
      });

      setImages((prev) => {
        const failedIds = new Set(tempImages.map((image) => image.id));
        const nextImages = prev.filter((image) => !failedIds.has(image.id));
        syncHiddenField(nextImages);
        return nextImages;
      });

      throw error;
    } finally {
      setIsUploadingImages(false);
    }
  }, [syncHiddenField]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop: useCallback(async (acceptedFiles: File[]) => {
      setClientMessage(null);

      const existingCount = images.length;
      const availableSlots = Math.max(0, MAX_UPLOAD_FILES - existingCount);
      const filesToAdd = acceptedFiles.slice(0, availableSlots);

      if (filesToAdd.length < acceptedFiles.length) {
        setClientMessage(`Podés subir hasta ${MAX_UPLOAD_FILES} imágenes por vez.`);
      }

      if (filesToAdd.length === 0) {
        return;
      }

      try {
        await uploadFiles(filesToAdd);
      } catch (error) {
        setClientMessage(error instanceof Error ? error.message : "No se pudieron subir las imágenes.");
      }
    }, [images.length, uploadFiles]),
  });

  const handleDeleteImage = useCallback(
    (id: string) => {
      setClientMessage(null);
      setImages((prev) => {
        const image = prev.find((item) => item.id === id);
        if (image?.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(image.preview);
        }
        const nextImages = prev.filter((item) => item.id !== id);
        syncHiddenField(nextImages);
        return nextImages;
      });
    },
    [syncHiddenField],
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      const nextImages = arrayMove(prev, oldIndex, newIndex);
      syncHiddenField(nextImages);
      return nextImages;
    });
  }, [syncHiddenField]);

  const getSerializableImageUrls = useCallback(
    (nextImages: ImageItem[]) =>
      nextImages
        .filter((image) => image.uploadStatus !== "uploading")
        .map((image) => image.url.trim())
        .filter(Boolean),
    [],
  );

  const handleSubmit = useCallback(() => {
    setClientMessage(null);

    const serializableImageUrls = getSerializableImageUrls(images);

    if (hiddenImageInputRef.current) {
      hiddenImageInputRef.current.value = serializableImageUrls.join("\n");
    }

    if (images.some((image) => image.source === "file" && image.uploadStatus !== "uploaded")) {
      setClientMessage("Esperá a que terminen de subir las imágenes antes de guardar.");
      return false;
    }

    return true;
  }, [getSerializableImageUrls, images]);

  useEffect(() => {
    syncAmenitiesField(amenitiesInput);
  }, [amenitiesInput, syncAmenitiesField]);

  useEffect(() => {
    if (!state.ok) return;

    const message = isEditing
      ? "Desarrollo actualizado exitosamente"
      : "Desarrollo creado exitosamente";

    setSuccessMessage(message);

    const timer = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    images.forEach((image) => {
      if (image.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(image.preview);
      }
    });

    setFormValues(getInitialFormValues(development));
    setAmenitiesInput(development?.amenities.join(", ") ?? "");
    setImages(initialImages);
    syncHiddenField(initialImages);
    setIsDialogOpen(false);
    router.push("/dashboard/nuevo-desarrollo");
    router.refresh();

    return () => {
      window.clearTimeout(timer);
    };
  }, [development, images, initialImages, isEditing, router, state.ok, syncHiddenField]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);

    if (!open) {
      router.push("/dashboard/nuevo-desarrollo");
      router.refresh();
    }
  }, [router]);

  const handleFormValueChange = useCallback(
    (field: keyof DevelopmentFormValues) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { value } = event.target;
        setFormValues((prev) => ({ ...prev, [field]: value }));
      },
    [],
  );

  const hasUploadingImages = images.some((image) => image.uploadStatus === "uploading");

  return (
    <section className="space-y-4">
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-[28px] border border-centa-green-1/10 bg-white p-4 shadow-[0_28px_80px_-36px_rgba(0,58,42,0.16)] sm:p-5">
        <Button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="w-full bg-centa-green-1 text-white hover:bg-centa-green-1/90 sm:w-auto"
        >
          <Plus className="size-4" />
          Nuevo desarrollo
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-2xl rounded-[28px] border border-centa-green-1/10 p-0 shadow-[0_28px_80px_-36px_rgba(0,58,42,0.28)] sm:p-0">
          <form
            ref={formRef}
            action={action}
            onSubmit={(event) => {
              if (!handleSubmit()) {
                event.preventDefault();
              }
            }}
            className="flex max-h-[85vh] flex-col"
          >
            <DialogHeader className="space-y-2 border-b border-centa-green-1/10 px-6 py-5 sm:px-8 sm:py-6">
              <DialogTitle>{isEditing ? "Editar desarrollo" : "Nuevo desarrollo"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Actualizá la información del emprendimiento y guardá los cambios."
                  : "Agregá un próximo emprendimiento con toda la información."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 scroll-smooth sm:px-8 sm:py-6">
              <input type="hidden" name="id" value={development?.id ?? ""} />
              <input ref={hiddenImageInputRef} type="hidden" name="imageUrls" defaultValue="" />
              <input ref={hiddenAmenitiesInputRef} type="hidden" name="amenities" defaultValue="" />
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 sm:col-span-2">
                    <span className="text-sm font-medium text-centa-black">Nombre del desarrollo</span>
                    <Input
                      name="developmentName"
                      required
                      placeholder="Ej: Torre Parque Belgrano"
                      className="bg-centa-off-white"
                      value={formValues.developmentName}
                      onChange={handleFormValueChange("developmentName")}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-centa-black">Ubicación</span>
                    <Input
                      name="ubicacion"
                      required
                      placeholder="Belgrano"
                      className="bg-centa-off-white"
                      value={formValues.ubicacion}
                      onChange={handleFormValueChange("ubicacion")}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-centa-black">Dirección</span>
                    <Input
                      name="direccion"
                      required
                      placeholder="Av. Libertador 1234"
                      className="bg-centa-off-white"
                      value={formValues.direccion}
                      onChange={handleFormValueChange("direccion")}
                    />
                  </label>

                  <label className="flex flex-col gap-2 sm:col-span-2">
                    <span className="text-sm font-medium text-centa-black">Descripción</span>
                    <textarea
                      name="descripcion"
                      required
                      rows={5}
                      placeholder="Contá qué hace especial a este emprendimiento."
                      value={formValues.descripcion}
                      onChange={handleFormValueChange("descripcion")}
                      className="min-h-36 rounded-2xl border border-input bg-centa-off-white px-4 py-3 text-sm text-centa-black outline-none transition focus-visible:border-centa-green-1 focus-visible:ring-4 focus-visible:ring-centa-green-1/10"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-centa-black">Fecha estimada de entrega</span>
                    <Input
                      name="constructionDate"
                      type="date"
                      className="bg-centa-off-white"
                      value={formValues.constructionDate}
                      onChange={handleFormValueChange("constructionDate")}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-centa-black">Amenities</span>
                    <Input
                      value={amenitiesInput}
                      onChange={(event) => setAmenitiesInput(event.target.value)}
                      placeholder="Pileta, SUM, gimnasio, cowork"
                      className="bg-centa-off-white"
                    />
                  </label>

                  <div className="grid gap-6 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-centa-black">Precio desde</span>
                      <Input
                        name="precio"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="Ej: 150000"
                        className="bg-centa-off-white"
                        value={formValues.precio}
                        onChange={handleFormValueChange("precio")}
                      />
                      <span className="text-sm text-muted-foreground">Precio de referencia para el desarrollo</span>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-centa-black">Moneda</span>
                      <select
                        name="moneda"
                        value={formValues.moneda}
                        onChange={handleFormValueChange("moneda")}
                        className="h-10 rounded-lg border border-input bg-centa-off-white px-3 text-sm outline-none transition focus-visible:border-centa-green-1 focus-visible:ring-4 focus-visible:ring-centa-green-1/10"
                      >
                        <option value="USD">USD</option>
                        <option value="ARS">ARS</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-centa-black">Imágenes</span>
                    <p className="text-sm text-muted-foreground">
                      Subí renders, avances de obra o referencias. La primera imagen será la portada.
                    </p>
                  </div>

                  <div
                    {...getRootProps()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                      isDragActive
                        ? "border-centa-green-1 bg-centa-green-1/5"
                        : "border-centa-green-1/20 bg-centa-off-white hover:border-centa-green-1/40 hover:bg-centa-green-1/5"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="size-6 text-centa-green-1" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-centa-black">Arrastrá imágenes aquí o hacé clic para seleccionar</p>
                      <p className="text-xs text-muted-foreground">Hasta {MAX_UPLOAD_FILES} archivos. Las imágenes se suben al instante.</p>
                    </div>
                  </div>

                  {images.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={images.map((image) => image.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {images.map((image, index) => (
                            <SortableThumbnail key={image.id} image={image} index={index} onDelete={handleDeleteImage} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : null}
                </div>

                {clientMessage ? <p className="text-sm text-red-600">{clientMessage}</p> : null}
                {state.message ? <p className={`text-sm ${state.ok ? "text-centa-green-1" : "text-red-600"}`}>{state.message}</p> : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-centa-green-1/10 px-6 py-4 sm:px-8 sm:py-5">
              <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || hasUploadingImages || isUploadingImages} className="min-w-48 bg-centa-green-1 text-white hover:bg-centa-green-1/90">
                {isPending || isUploadingImages ? <Loader2 className="size-4 animate-spin" /> : null}
                {isPending ? "Guardando..." : hasUploadingImages || isUploadingImages ? "Subiendo imágenes..." : isEditing ? "Guardar cambios" : "Crear desarrollo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
