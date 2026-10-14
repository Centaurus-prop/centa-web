import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createPropertyImageKey,
  generatePresignedUploadUrl,
  getPropertyImageUrl,
} from "@/lib/s3-upload";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILES = 10;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type PresignFileInput = {
  filename: string;
  contentType: string;
};

function createUploadPropertyId() {
  return `upload-${crypto.randomUUID()}`;
}

function isPresignFileInput(value: unknown): value is PresignFileInput {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return typeof candidate.filename === "string" && typeof candidate.contentType === "string";
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { files?: unknown } | null;
    const files = Array.isArray(body?.files) ? body.files.filter(isPresignFileInput) : [];

    if (files.length === 0) {
      return NextResponse.json({ error: "No se enviaron archivos." }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Podés subir hasta ${MAX_FILES} imágenes por vez.` }, { status: 400 });
    }

    for (const file of files) {
      if (!file.filename.trim()) {
        return NextResponse.json({ error: "Todos los archivos deben tener nombre." }, { status: 400 });
      }

      if (!ALLOWED_TYPES.has(file.contentType)) {
        return NextResponse.json({ error: `Tipo de archivo no permitido: ${file.filename}` }, { status: 400 });
      }
    }

    const propertyId = createUploadPropertyId();
    const uploads = await Promise.all(
      files.map(async (file) => {
        const key = createPropertyImageKey(propertyId, file.filename);
        const url = await generatePresignedUploadUrl(key, file.contentType);

        return {
          key,
          url,
          publicUrl: getPropertyImageUrl(key),
        };
      }),
    );

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("[POST /api/upload/presign] failed", error);
    return NextResponse.json({ error: "No se pudieron preparar las subidas." }, { status: 500 });
  }
}
