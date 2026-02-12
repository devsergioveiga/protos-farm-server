CREATE TABLE "user_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
INSERT INTO "user_types" ("id", "name", "slug", "is_system")
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Super Admin', 'super_admin', true),
  ('22222222-2222-4222-8222-222222222222', 'Org Admin', 'org_admin', true),
  ('33333333-3333-4333-8333-333333333333', 'User', 'user', true);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_type_id" uuid;
--> statement-breakpoint
UPDATE "users" SET "user_type_id" = '33333333-3333-4333-8333-333333333333' WHERE "user_type_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_user_type_id_user_types_id_fk" FOREIGN KEY ("user_type_id") REFERENCES "public"."user_types"("id") ON DELETE restrict ON UPDATE no action;
