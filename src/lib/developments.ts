import { rawSql } from "@/lib/db";

export interface Development {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  location?: string;
  city: string;
  price?: string;
  currency: string;
  constructionDate?: string;
  amenities: string[];
  images: string[];
  coverImage?: string;
  status: string;
  published: boolean;
  destacada: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DevelopmentDetail extends Development {
  resolvedImages: string[];
}

interface DevelopmentImageRow {
  url: string | null;
  sort_order: number | null;
}

interface DevelopmentRow extends Record<string, unknown> {
  image_rows?: DevelopmentImageRow[] | null;
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function normalizeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function resolveDevelopmentImages(images: string[], coverImage?: string): string[] {
  const candidates = [coverImage, ...images]
    .map((image) => normalizeImageUrl(image))
    .filter((image): image is string => Boolean(image));

  return Array.from(new Set(candidates));
}

function parseImageRows(rows: DevelopmentImageRow[] | null | undefined): string[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((row) => normalizeImageUrl(row.url))
    .filter((image): image is string => Boolean(image));
}

function mapRow(row: DevelopmentRow): Development {
  const relationalImages = parseImageRows(row.image_rows);
  const legacyImages = parseJsonArray((row.images as string | null) ?? null)
    .map((image) => normalizeImageUrl(image))
    .filter((image): image is string => Boolean(image));
  const images = relationalImages.length > 0 ? relationalImages : legacyImages;
  const coverImage = normalizeImageUrl((row.cover_image as string | null) ?? null) ?? images[0];

  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? undefined,
    address: (row.address as string) ?? undefined,
    location: (row.location as string) ?? undefined,
    city: (row.city as string) ?? "Buenos Aires",
    price: (row.price as string) ?? undefined,
    currency: (row.currency as string) ?? "USD",
    constructionDate: (row.construction_date as string) ?? undefined,
    amenities: parseJsonArray((row.amenities as string | null) ?? null),
    images,
    coverImage,
    status: (row.status as string) ?? "upcoming",
    published: Boolean(row.published),
    destacada: Boolean(row.destacada),
    createdBy: (row.created_by as string) ?? undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

async function fetchDevelopments(whereClause?: string, params: unknown[] = []): Promise<Development[]> {
  const query = `
    SELECT
      d.*,
      COALESCE(
        json_agg(
          json_build_object('url', di.url, 'sort_order', di.sort_order)
          ORDER BY di.sort_order ASC, di.created_at ASC
        ) FILTER (WHERE di.id IS NOT NULL),
        '[]'::json
      ) AS image_rows
    FROM developments d
    LEFT JOIN development_images di ON di.development_id = d.id
    ${whereClause ? `${whereClause}` : ""}
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;

  const rows = await rawSql.query(query, params);
  return rows.map((row) => mapRow(row as DevelopmentRow));
}

export async function getAllDevelopments(): Promise<Development[]> {
  return fetchDevelopments();
}

export async function getPublishedDevelopments(): Promise<Development[]> {
  return fetchDevelopments(
    `WHERE d.published = true
      AND COALESCE(d.status, 'upcoming') = 'upcoming'`,
  );
}

export async function getFeaturedLocalDevelopments(): Promise<Development[]> {
  return fetchDevelopments("WHERE d.destacada = true");
}

export async function getDevelopmentById(id: string): Promise<Development | null> {
  const rows = await fetchDevelopments("WHERE d.id = $1", [id]);
  return rows[0] ?? null;
}

export async function getDevelopmentBySlug(slug: string): Promise<DevelopmentDetail | null> {
  const rows = await fetchDevelopments("WHERE d.slug = $1 AND d.published = true", [slug]);
  const development = rows[0];

  if (!development) return null;

  return {
    ...development,
    resolvedImages: resolveDevelopmentImages(development.images, development.coverImage),
  };
}

async function replaceDevelopmentImages(developmentId: string, images: string[]): Promise<void> {
  await rawSql`DELETE FROM development_images WHERE development_id = ${developmentId}`;

  const normalizedImages = images
    .map((image) => normalizeImageUrl(image))
    .filter((image): image is string => Boolean(image));

  for (const [index, image] of normalizedImages.entries()) {
    await rawSql`
      INSERT INTO development_images (development_id, url, sort_order)
      VALUES (${developmentId}, ${image}, ${index})
    `;
  }
}

export async function createDevelopment(input: {
  name: string;
  description?: string;
  address?: string;
  location?: string;
  price?: string;
  currency?: string;
  constructionDate?: string;
  amenities: string[];
  images: string[];
  createdBy?: string;
}): Promise<Development> {
  const slug = `${slugify(input.name)}-${Date.now()}`;
  const normalizedImages = input.images
    .map((image) => normalizeImageUrl(image))
    .filter((image): image is string => Boolean(image));
  const imagesJson = JSON.stringify(normalizedImages);
  const amenitiesJson = JSON.stringify(input.amenities);

  const rows = await rawSql`
    INSERT INTO developments (name, slug, description, address, location, city, price, currency, construction_date, amenities, images, cover_image, status, published, created_by)
    VALUES (${input.name}, ${slug}, ${input.description || null}, ${input.address || null}, ${input.location || null}, 'Buenos Aires', ${input.price || null}, ${input.currency || "USD"}, ${input.constructionDate || null}, ${amenitiesJson}, ${imagesJson}, ${normalizedImages[0] || null}, 'upcoming', true, ${input.createdBy || null})
    RETURNING id
  `;

  const developmentId = rows[0].id as string;
  await replaceDevelopmentImages(developmentId, normalizedImages);

  return (await getDevelopmentById(developmentId))!;
}

export async function updateDevelopment(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    address: string;
    location: string;
    price: string;
    currency: string;
    constructionDate: string;
    amenities: string[];
    images: string[];
    published: boolean;
    status: string;
  }>,
): Promise<void> {
  const sets: string[] = ["updated_at = now()"]; 
  const values: unknown[] = [];
  let idx = 1;

  const addField = (col: string, val: unknown) => {
    sets.push(`${col} = $${idx}`);
    values.push(val);
    idx++;
  };

  if (input.name !== undefined) addField("name", input.name);
  if (input.description !== undefined) addField("description", input.description);
  if (input.address !== undefined) addField("address", input.address);
  if (input.location !== undefined) addField("location", input.location);
  if (input.price !== undefined) addField("price", input.price);
  if (input.currency !== undefined) addField("currency", input.currency);
  if (input.constructionDate !== undefined) addField("construction_date", input.constructionDate);
  if (input.amenities !== undefined) addField("amenities", JSON.stringify(input.amenities));

  let normalizedImages: string[] | undefined;
  if (input.images !== undefined) {
    normalizedImages = input.images
      .map((image) => normalizeImageUrl(image))
      .filter((image): image is string => Boolean(image));
    addField("images", JSON.stringify(normalizedImages));
    addField("cover_image", normalizedImages[0] || null);
  }
  if (input.published !== undefined) addField("published", input.published);
  if (input.status !== undefined) addField("status", input.status);

  values.push(id);
  const query = `UPDATE developments SET ${sets.join(", ")} WHERE id = $${idx}`;
  await rawSql.query(query, values);

  if (normalizedImages !== undefined) {
    await replaceDevelopmentImages(id, normalizedImages);
  }
}

export async function deleteDevelopment(id: string): Promise<void> {
  await rawSql`
    DELETE FROM developments WHERE id = ${id}
  `;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
