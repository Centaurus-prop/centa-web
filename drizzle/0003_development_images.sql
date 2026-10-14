CREATE TABLE IF NOT EXISTS "development_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"development_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "development_images" ADD CONSTRAINT "development_images_development_id_developments_id_fk" FOREIGN KEY ("development_id") REFERENCES "public"."developments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_development_images_development" ON "development_images" USING btree ("development_id");
--> statement-breakpoint
INSERT INTO "development_images" ("development_id", "url", "sort_order")
SELECT d."id", image.value, image.ordinality - 1
FROM "developments" d
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE
    WHEN d."images" IS NULL OR btrim(d."images") = '' THEN '[]'::jsonb
    ELSE d."images"::jsonb
  END
) WITH ORDINALITY AS image(value, ordinality)
WHERE NOT EXISTS (
  SELECT 1 FROM "development_images" di WHERE di."development_id" = d."id"
);
