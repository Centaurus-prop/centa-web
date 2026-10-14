import "server-only";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!region || !bucket || !accessKeyId || !secretAccessKey) {
  throw new Error("Faltan variables de entorno de AWS S3.");
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function sanitizeFilename(filename: string) {
  const extIndex = filename.lastIndexOf(".");
  const extension = extIndex >= 0 ? filename.slice(extIndex).toLowerCase() : "";
  const base = extIndex >= 0 ? filename.slice(0, extIndex) : filename;

  const sanitizedBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${sanitizedBase || "image"}${extension}`;
}

function buildKey(propertyId: string, filename: string) {
  return `properties/${propertyId}/${Date.now()}-${sanitizeFilename(filename)}`;
}

export function createPropertyImageKey(propertyId: string, filename: string) {
  return buildKey(propertyId, filename);
}

export function getPropertyImageUrl(key: string) {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export function getS3Client() {
  return s3;
}

export async function generatePresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 300 });
}

export async function uploadPropertyImage(file: File, propertyId: string): Promise<string> {
  const key = buildKey(propertyId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  return getPropertyImageUrl(key);
}

export async function deletePropertyImage(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
