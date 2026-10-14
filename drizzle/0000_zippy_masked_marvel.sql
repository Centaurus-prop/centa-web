CREATE TYPE "public"."category" AS ENUM('a-estrenar', 'usado', 'emprendimiento');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('ARS', 'USD');--> statement-breakpoint
CREATE TYPE "public"."development_stage" AS ENUM('none', 'upcoming', 'active', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('web', 'tokko', 'whatsapp', 'manual');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('nuevo', 'contactado', 'en_progreso', 'descartado', 'convertido');--> statement-breakpoint
CREATE TYPE "public"."property_kind" AS ENUM('property', 'development');--> statement-breakpoint
CREATE TYPE "public"."property_source" AS ENUM('tokko', 'local');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'asesor', 'revisor');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('disponible', 'reservado', 'vendido');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('success', 'partial', 'failed');--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid,
	"assigned_to" uuid,
	"name" varchar(150) NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"message" text,
	"source" "lead_source" DEFAULT 'web' NOT NULL,
	"status" "lead_status" DEFAULT 'nuevo' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tokko_id" integer,
	"slug" varchar(255),
	"titulo" varchar(255) NOT NULL,
	"descripcion" text,
	"precio" numeric(14, 2) NOT NULL,
	"moneda" "currency" DEFAULT 'USD' NOT NULL,
	"m2" integer NOT NULL,
	"ambientes" integer NOT NULL,
	"banos" integer NOT NULL,
	"ubicacion" varchar(255) NOT NULL,
	"barrio" varchar(100) NOT NULL,
	"ciudad" varchar(100) DEFAULT 'Buenos Aires' NOT NULL,
	"categoria" "category" NOT NULL,
	"imagen_url" text,
	"destacada" boolean DEFAULT false NOT NULL,
	"estado" "status" DEFAULT 'disponible' NOT NULL,
	"publicado" boolean DEFAULT true NOT NULL,
	"source" "property_source" DEFAULT 'tokko' NOT NULL,
	"kind" "property_kind" DEFAULT 'property' NOT NULL,
	"publish_status" "publish_status" DEFAULT 'published' NOT NULL,
	"development_stage" "development_stage" DEFAULT 'none' NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"published_at" timestamp,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" varchar(255),
	"orden" integer DEFAULT 0 NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokko_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "sync_status" NOT NULL,
	"properties_synced" integer DEFAULT 0 NOT NULL,
	"properties_created" integer DEFAULT 0 NOT NULL,
	"properties_updated" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"meta" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(150) NOT NULL,
	"avatar_url" text,
	"role" "role" DEFAULT 'asesor' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"password_hash" varchar(255),
	"google_sub" varchar(255),
	"phone" varchar(30),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_favorites_user_property" ON "favorites" USING btree ("user_id","property_id");--> statement-breakpoint
CREATE INDEX "idx_leads_property" ON "leads" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_leads_assigned" ON "leads" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_leads_status" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_leads_source" ON "leads" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_leads_created" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_properties_tokko_id" ON "properties" USING btree ("tokko_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_properties_slug" ON "properties" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_properties_categoria" ON "properties" USING btree ("categoria");--> statement-breakpoint
CREATE INDEX "idx_properties_barrio" ON "properties" USING btree ("barrio");--> statement-breakpoint
CREATE INDEX "idx_properties_destacada" ON "properties" USING btree ("destacada");--> statement-breakpoint
CREATE INDEX "idx_properties_source" ON "properties" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_properties_kind" ON "properties" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "idx_properties_publish_status" ON "properties" USING btree ("publish_status");--> statement-breakpoint
CREATE INDEX "idx_properties_development_stage" ON "properties" USING btree ("development_stage");--> statement-breakpoint
CREATE INDEX "idx_property_images_property" ON "property_images" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_tokko_sync_started" ON "tokko_sync_log" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email" ON "users" USING btree ("email");