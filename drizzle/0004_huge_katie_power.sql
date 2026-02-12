-- Add organization_id to persons (nullable first for migration)
ALTER TABLE "persons" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
-- Add organization_id to users
ALTER TABLE "users" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
-- Create default organization for existing data (id: 00000000-0000-4000-8000-000000000001)
INSERT INTO "organizations" ("id", "name", "slug", "is_active", "created_at", "updated_at")
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Organização Padrão',
  'organizacao-padrao',
  true,
  now(),
  now()
)
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
-- Update existing persons to use default organization
UPDATE "persons" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'organizacao-padrao' LIMIT 1)
WHERE "organization_id" IS NULL;
--> statement-breakpoint
-- Update existing users (non-super_admin) to use default organization
UPDATE "users" SET "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'organizacao-padrao' LIMIT 1)
WHERE "user_type_id" != '11111111-1111-4111-8111-111111111111' AND "organization_id" IS NULL;
--> statement-breakpoint
-- Make persons.organization_id NOT NULL
ALTER TABLE "persons" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
-- Add FK constraints
ALTER TABLE "persons" ADD CONSTRAINT "persons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
