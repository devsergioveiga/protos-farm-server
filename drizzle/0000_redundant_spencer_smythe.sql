CREATE TYPE "public"."person_type" AS ENUM('PF', 'PJ');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('USER', 'CLIENT', 'SUPPLIER', 'EMPLOYEE');--> statement-breakpoint
CREATE TABLE "person_roles" (
	"person_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	CONSTRAINT "person_roles_person_id_role_pk" PRIMARY KEY("person_id","role")
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"person_type" "person_type" NOT NULL,
	"document_number" varchar(14) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "persons_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
ALTER TABLE "person_roles" ADD CONSTRAINT "person_roles_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;