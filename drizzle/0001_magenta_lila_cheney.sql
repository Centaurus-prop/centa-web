ALTER TABLE "properties" ADD COLUMN "development_id" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "development_name" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "development_data" text;--> statement-breakpoint
CREATE INDEX "idx_properties_development_id" ON "properties" USING btree ("development_id");