CREATE TYPE "public"."permission_action" AS ENUM('create', 'read', 'update', 'delete');--> statement-breakpoint
CREATE TABLE "permissions" (
	"user_type_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"resource" varchar(64) NOT NULL,
	"action" "permission_action" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_user_type_id_organization_id_resource_action_pk" PRIMARY KEY("user_type_id","organization_id","resource","action")
);
--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_type_id_user_types_id_fk" FOREIGN KEY ("user_type_id") REFERENCES "public"."user_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;