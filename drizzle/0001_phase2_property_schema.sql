DO $$ BEGIN
  CREATE TYPE "public"."property_source" AS ENUM('tokko', 'local');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."property_kind" AS ENUM('property', 'development');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."publish_status" AS ENUM('draft', 'review', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."development_stage" AS ENUM('none', 'upcoming', 'active', 'delivered');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "slug" varchar(255);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "source" "property_source" DEFAULT 'tokko' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "kind" "property_kind" DEFAULT 'property' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "publish_status" "publish_status" DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "development_stage" "development_stage" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "created_by" uuid;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "archived_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "properties" ADD CONSTRAINT "properties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "properties" ADD CONSTRAINT "properties_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_properties_slug" ON "properties" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_source" ON "properties" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_kind" ON "properties" USING btree ("kind");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_publish_status" ON "properties" USING btree ("publish_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_properties_development_stage" ON "properties" USING btree ("development_stage");
