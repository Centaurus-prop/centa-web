import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadPropertyImage } from "@/lib/s3-upload";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILES = 10;
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function createUploadPropertyId() {
  return `upload-${crypto.randomUUID()}`;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const entries = formData.getAll("files");
    const files = entries.filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No se enviaron archivos." }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Podés subir hasta ${MAX_FILES} imágenes por vez.` }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json({ error: `Tipo de archivo no permitido: ${file.name}` }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `${file.name} supera el máximo de 30MB.` }, { status: 400 });
      }
    }

    const propertyId = String(formData.get("propertyId") ?? "").trim() || createUploadPropertyId();
    const urls = await Promise.all(files.map((file) => uploadPropertyImage(file, propertyId)));

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("[POST /api/upload] failed", error);
    return NextResponse.json({ error: "No se pudieron subir las imágenes." }, { status: 500 });
  }
}
