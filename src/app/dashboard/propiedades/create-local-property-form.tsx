"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import type { FormEvent, JSX } from "react";
import { Loader2, Upload, GripVertical, X } from "lucide-react";
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
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { createLocalPropertyAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DevelopmentStage,
  PropertyCategory,
  PropertyKind,
  PublishStatus,
} from "@/types/property";

interface ImageItem {
  id: string;
  url: string;
  preview?: string;
  file?: File;
  source: "url" | "file";
}

const initialState = {
  ok: false,
  message: "",
};

const MAX_UPLOAD_FILES = 10;

const categoryOptions: { value: PropertyCategory; label: string }[] = [
  { value: "a-estrenar", label: "A estrenar" },
  { value: "usado", label: "Usado" },
  { value: "emprendimiento", label: "Emprendimiento" },
];

const publishOptions: { value: PublishStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "review", label: "En revisión" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
];

const stageOptions: { value: DevelopmentStage; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "upcoming", label: "Próximamente" },
  { value: "delivered", label: "Entregado" },
];

function SectionHeader({ children }: { children: string }): JSX.Element {
  return (
    <>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-centa-muted-1">
        {children}
      </h3>
      <Separator className="mb-4" />
    </>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}): JSX.Element {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-centa-black">{label}</span>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function SortableThumbnail({
  image,
  index,
  onDelete,
}: {
  image: ImageItem;
  index: number;
  onDelete: (id: string) => void;
}): JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative size-20 overflow-hidden rounded-lg border border-centa-border-soft bg-white"
    >
      <button
        type="button"
        className="absolute top-0.5 left-0.5 z-10 rounded bg-white/80 p-0.5 text-centa-muted-1 hover:text-centa-black"
        aria-label="Arrastrar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onDelete(image.id)}
        className="absolute top-0.5 right-0.5 z-10 rounded bg-white/80 p-0.5 text-centa-muted-1 hover:text-red-600"
        aria-label="Eliminar imagen"
      >
        <X className="size-3.5" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.preview || image.url}
        alt={`Imagen ${index + 1}`}
        className="size-full object-cover"
      />

      {index === 0 && (
        <Badge
          className="absolute bottom-0.5 left-0.5 bg-centa-green-1 text-white text-[0.55rem] px-1.5 py-0 min-h-0"
        >
          Principal
        </Badge>
      )}
    </div>
  );
}

export function CreateLocalPropertyForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}): JSX.Element {
  const [state, action, isPending] = useActionState(
    createLocalPropertyAction,
    initialState,
  );
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [kind, setKind] = useState<PropertyKind>("property");

  const [images, setImages] = useState<ImageItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop: useCallback((acceptedFiles: File[]) => {
      setClientMessage(null);
      setImages((prev) => {
        const existingFiles = prev.filter((image) => image.source === "file").length;
        const availableSlots = Math.max(0, MAX_UPLOAD_FILES - existingFiles);
        const filesToAdd = acceptedFiles.slice(0, availableSlots);

        if (filesToAdd.length < acceptedFiles.length) {
          setClientMessage(`Podés subir hasta ${MAX_UPLOAD_FILES} imágenes por vez.`);
        }

        const newImages: ImageItem[] = filesToAdd.map((file) => ({
          id: crypto.randomUUID(),
          url: "",
          file,
          preview: URL.createObjectURL(file),
          source: "file" as const,
        }));

        return [...prev, ...newImages];
      });
    }, []),
  });

  const handleAddUrl = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setClientMessage(null);
    setImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        url: trimmed,
        preview: trimmed,
        source: "url",
      },
    ]);
    setUrlInput("");
  }, [urlInput]);

  const handleDeleteImage = useCallback((id: string) => {
    setClientMessage(null);
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(img.preview);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const formRef = useRef<HTMLFormElement>(null);

  const syncHiddenField = useCallback((nextImages: ImageItem[]) => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = nextImages
        .map((i) => i.url)
        .filter(Boolean)
        .join("\n");
    }
  }, []);

  const uploadPendingFiles = useCallback(async () => {
    const filesToUpload = images.filter((image) => image.source === "file" && image.file);

    if (filesToUpload.length === 0) {
      syncHiddenField(images);
      return images;
    }

    const formData = new FormData();
    for (const image of filesToUpload) {
      if (image.file) {
        formData.append("files", image.file);
      }
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | { urls?: string[]; error?: string }
      | null;

    if (!response.ok || !payload?.urls) {
      throw new Error(payload?.error || "No se pudieron subir las imágenes.");
    }

    let urlIndex = 0;
    const nextImages = images.map((image) => {
      if (image.source !== "file") {
        return image;
      }

      const uploadedUrl = payload.urls?.[urlIndex++];
      if (!uploadedUrl) {
        throw new Error("La subida devolvió una cantidad inesperada de URLs.");
      }

      if (image.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(image.preview);
      }

      return {
        ...image,
        url: uploadedUrl,
        preview: uploadedUrl,
        file: undefined,
      };
    });

    setImages(nextImages);
    syncHiddenField(nextImages);
    return nextImages;
  }, [images, syncHiddenField]);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClientMessage(null);
    setIsUploading(true);

    try {
      await uploadPendingFiles();
      event.currentTarget.requestSubmit();
    } catch (error) {
      setClientMessage(error instanceof Error ? error.message : "No se pudieron subir las imágenes.");
    } finally {
      setIsUploading(false);
    }
  }, [uploadPendingFiles]);

  useEffect(() => {
    if (state.ok) {
      images.forEach((img) => {
        if (img.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(img.preview);
        }
      });
      setImages([]);
      setUrlInput("");
      setClientMessage(null);
      setKind("property");
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state.ok, onSuccess, images]);

  return (
    <form
      ref={formRef}
      id="create-local-property-form"
      action={action}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <input
        ref={hiddenInputRef}
        type="hidden"
        name="imageUrls"
        defaultValue=""
      />

      <SectionHeader>Información básica</SectionHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-centa-black">Título</span>
          <Input name="titulo" required placeholder="Ej: Torre Libertador" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">
            Slug opcional
          </span>
          <Input name="slug" placeholder="torre-libertador" />
        </label>

        {kind === "development" ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-centa-black">Nombre del emprendimiento</span>
            <Input name="developmentName" placeholder="Ej: Dragones" />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-centa-black">
            Descripción
          </span>
          <textarea
            name="descripcion"
            required
            rows={4}
            className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder={kind === "development" ? "Descripción comercial del emprendimiento" : "Resumen comercial / interno de la propiedad"}
          />
        </label>
      </div>

      <SectionHeader>Precio y specs</SectionHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">Precio</span>
          <Input
            name="precio"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="150000"
          />
        </label>

        <SelectField
          name="moneda"
          label="Moneda"
          defaultValue="USD"
          options={[
            { value: "USD", label: "USD" },
            { value: "ARS", label: "ARS" },
          ]}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">m²</span>
          <Input
            name="m2"
            type="number"
            min="0"
            required
            placeholder="120"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">
            Ambientes
          </span>
          <Input
            name="ambientes"
            type="number"
            min="0"
            required
            placeholder="3"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">Baños</span>
          <Input
            name="banos"
            type="number"
            min="0"
            required
            placeholder="2"
          />
        </label>

        <SelectField
          name="estado"
          label="Disponibilidad"
          defaultValue="disponible"
          options={[
            { value: "disponible", label: "Disponible" },
            { value: "reservado", label: "Reservado" },
            { value: "vendido", label: "Vendido" },
          ]}
        />
      </div>

      <SectionHeader>Clasificación</SectionHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">Tipo interno</span>
          <Select name="kind" defaultValue="property" onValueChange={(value) => setKind(value as PropertyKind)}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Tipo interno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="property">Propiedad</SelectItem>
              <SelectItem value="development">Desarrollo</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <SelectField
          name="categoria"
          label="Categoría"
          defaultValue="usado"
          options={categoryOptions}
        />

        <SelectField
          name="publishStatus"
          label="Estado editorial"
          defaultValue="draft"
          options={publishOptions}
        />

        {kind === "development" ? (
          <SelectField
            name="developmentStage"
            label="Etapa del emprendimiento"
            defaultValue="active"
            options={stageOptions}
          />
        ) : (
          <input type="hidden" name="developmentStage" value="none" />
        )}
      </div>

      <SectionHeader>Ubicación</SectionHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">
            Ubicación
          </span>
          <Input
            name="ubicacion"
            required
            placeholder="Belgrano, Buenos Aires"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">Barrio</span>
          <Input name="barrio" required placeholder="Belgrano" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">Ciudad</span>
          <Input name="ciudad" defaultValue="Buenos Aires" />
        </label>
      </div>

      <SectionHeader>Imágenes</SectionHeader>

      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-centa-black">
            Agregar URL de imagen
          </span>
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="shrink-0"
        >
          Agregar URL
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isDragActive
            ? "border-centa-green-2 bg-centa-accent-soft/30"
            : "border-centa-border-soft hover:border-centa-green-2 hover:bg-centa-accent-soft/30"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="size-6 text-centa-muted-2" />
        <p className="text-sm text-centa-muted-1">
          Arrastrá imágenes aquí o hacé clic para seleccionar
        </p>
      </div>

      <p className="text-xs text-centa-muted-2">
        Podés mezclar URLs manuales con archivos locales. Las imágenes locales se suben a S3 al guardar el item.
      </p>

      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((image, index) => (
                <SortableThumbnail
                  key={image.id}
                  image={image}
                  index={index}
                  onDelete={handleDeleteImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Separator />

      <div className="space-y-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-centa-black">
          <input
            type="checkbox"
            name="destacada"
            className="size-4 rounded border-gray-300"
          />
          Marcar como destacada
        </label>

        {clientMessage ? <p className="text-sm text-red-600">{clientMessage}</p> : null}
        {state.message ? (
          <p
            className={`text-sm ${state.ok ? "text-centa-green-1" : "text-red-600"}`}
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || isUploading} className="min-w-44">
            {isPending || isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isUploading ? "Subiendo imágenes..." : "Guardar item local"}
          </Button>
        </div>
      </div>
    </form>
  );
}
