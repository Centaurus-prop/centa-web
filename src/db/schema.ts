import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ───

export const categoryEnum = pgEnum("category", [
  "a-estrenar",
  "usado",
  "emprendimiento",
]);

export const statusEnum = pgEnum("status", [
  "disponible",
  "reservado",
  "vendido",
]);

export const currencyEnum = pgEnum("currency", ["ARS", "USD"]);

export const roleEnum = pgEnum("role", ["admin", "asesor", "revisor"]);

export const leadSourceEnum = pgEnum("lead_source", [
  "web",
  "tokko",
  "whatsapp",
  "manual",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "nuevo",
  "contactado",
  "en_progreso",
  "descartado",
  "convertido",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "success",
  "partial",
  "failed",
]);

export const propertySourceEnum = pgEnum("property_source", ["tokko", "local"]);
export const propertyKindEnum = pgEnum("property_kind", ["property", "development"]);
export const publishStatusEnum = pgEnum("publish_status", ["draft", "review", "published", "archived"]);
export const developmentStageEnum = pgEnum("development_stage", ["none", "upcoming", "active", "delivered"]);

// ─── Properties ───

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokkoId: integer("tokko_id"), // ID from Tokko Broker API
  slug: varchar("slug", { length: 255 }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  precio: numeric("precio", { precision: 14, scale: 2 }).notNull(),
  moneda: currencyEnum("moneda").notNull().default("USD"),
  m2: integer("m2").notNull(),
  ambientes: integer("ambientes").notNull(),
  banos: integer("banos").notNull(),
  ubicacion: varchar("ubicacion", { length: 255 }).notNull(),
  barrio: varchar("barrio", { length: 100 }).notNull(),
  ciudad: varchar("ciudad", { length: 100 }).notNull().default("Buenos Aires"),
  categoria: categoryEnum("categoria").notNull(),
  imagenUrl: text("imagen_url"),
  destacada: boolean("destacada").notNull().default(false),
  estado: statusEnum("estado").notNull().default("disponible"),
  publicado: boolean("publicado").notNull().default(true),
  source: propertySourceEnum("source").notNull().default("tokko"),
  kind: propertyKindEnum("kind").notNull().default("property"),
  publishStatus: publishStatusEnum("publish_status").notNull().default("published"),
  developmentStage: developmentStageEnum("development_stage").notNull().default("none"),
  developmentId: text("development_id"),
  developmentName: text("development_name"),
  developmentData: text("development_data"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_properties_tokko_id").on(table.tokkoId),
  uniqueIndex("idx_properties_slug").on(table.slug),
  index("idx_properties_categoria").on(table.categoria),
  index("idx_properties_barrio").on(table.barrio),
  index("idx_properties_destacada").on(table.destacada),
  index("idx_properties_source").on(table.source),
  index("idx_properties_kind").on(table.kind),
  index("idx_properties_publish_status").on(table.publishStatus),
  index("idx_properties_development_stage").on(table.developmentStage),
  index("idx_properties_development_id").on(table.developmentId),
]);

// ─── Property Images ───

export const propertyImages = pgTable("property_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 255 }),
  orden: integer("orden").notNull().default(0),
  isMain: boolean("is_main").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_property_images_property").on(table.propertyId),
]);

export const developments = pgTable("developments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  address: varchar("address", { length: 500 }),
  location: varchar("location", { length: 255 }),
  city: varchar("city", { length: 255 }).default("Buenos Aires"),
  price: varchar("price", { length: 50 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  constructionDate: varchar("construction_date", { length: 50 }),
  amenities: text("amenities"),
  images: text("images"),
  coverImage: varchar("cover_image", { length: 1000 }),
  status: varchar("status", { length: 50 }).default("upcoming"),
  published: boolean("published").default(false),
  destacada: boolean("destacada").default(false),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_developments_slug").on(table.slug),
  index("idx_developments_published").on(table.published),
  index("idx_developments_status").on(table.status),
]);

export const developmentImages = pgTable("development_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  developmentId: uuid("development_id")
    .notNull()
    .references(() => developments.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: varchar("alt_text", { length: 255 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_development_images_development").on(table.developmentId),
]);

// ─── Users ───

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  avatarUrl: text("avatar_url"),
  role: roleEnum("role").notNull().default("asesor"),
  active: boolean("active").notNull().default(true),
  passwordHash: varchar("password_hash", { length: 255 }),
  googleSub: varchar("google_sub", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_users_email").on(table.email),
]);

// ─── Leads ───

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "set null" }),
  assignedTo: uuid("assigned_to")
    .references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  message: text("message"),
  source: leadSourceEnum("source").notNull().default("web"),
  status: leadStatusEnum("status").notNull().default("nuevo"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_leads_property").on(table.propertyId),
  index("idx_leads_assigned").on(table.assignedTo),
  index("idx_leads_status").on(table.status),
  index("idx_leads_source").on(table.source),
  index("idx_leads_created").on(table.createdAt),
]);

// ─── Favorites ───

export const favorites = pgTable("favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_favorites_user_property").on(table.userId, table.propertyId),
]);

// ─── Tokko Sync Log ───

export const tokkoSyncLog = pgTable("tokko_sync_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: syncStatusEnum("status").notNull(),
  propertiesSynced: integer("properties_synced").notNull().default(0),
  propertiesCreated: integer("properties_created").notNull().default(0),
  propertiesUpdated: integer("properties_updated").notNull().default(0),
  errorMessage: text("error_message"),
  meta: jsonb("meta"), // extra data: filters used, raw counts, etc.
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
}, (table) => [
  index("idx_tokko_sync_started").on(table.startedAt),
]);

// ─── Type exports ───

export type PropertyRecord = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

export type UserRecord = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type LeadRecord = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type PropertyImageRecord = typeof propertyImages.$inferSelect;
export type NewPropertyImage = typeof propertyImages.$inferInsert;

export type DevelopmentRecord = typeof developments.$inferInsert;
export type DevelopmentImageRecord = typeof developmentImages.$inferSelect;
export type NewDevelopmentImage = typeof developmentImages.$inferInsert;

export type FavoriteRecord = typeof favorites.$inferSelect;

export type TokkoSyncLogRecord = typeof tokkoSyncLog.$inferSelect;
