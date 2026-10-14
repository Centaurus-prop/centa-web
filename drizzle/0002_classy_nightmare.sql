CREATE TABLE "developments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"address" varchar(500),
	"location" varchar(255),
	"city" varchar(255) DEFAULT 'Buenos Aires',
	"price" varchar(50),
	"currency" varchar(3) DEFAULT 'USD',
	"construction_date" varchar(50),
	"amenities" text,
	"images" text,
	"cover_image" varchar(1000),
	"status" varchar(50) DEFAULT 'upcoming',
	"published" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "developments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "developments" ADD CONSTRAINT "developments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_developments_slug" ON "developments" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_developments_published" ON "developments" USING btree ("published");--> statement-breakpoint
CREATE INDEX "idx_developments_status" ON "developments" USING btree ("status");