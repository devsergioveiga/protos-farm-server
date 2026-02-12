ALTER TYPE "public"."role" ADD VALUE 'MANUFACTURER';--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'FARM_OWNER';--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"logradouro" varchar(255) NOT NULL,
	"numero" varchar(50) NOT NULL,
	"bairro" varchar(255) NOT NULL,
	"cep" varchar(10) NOT NULL,
	"cidade" varchar(255) NOT NULL,
	"uf" varchar(2) NOT NULL,
	"observacao" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;