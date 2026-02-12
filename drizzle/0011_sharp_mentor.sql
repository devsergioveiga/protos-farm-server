CREATE TYPE "public"."bank_account_type" AS ENUM('CONTA_CORRENTE', 'CONTA_POUPANCA', 'CONTA_INVESTIMENTO');--> statement-breakpoint
CREATE TABLE "bank_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"identificacao" varchar(255) NOT NULL,
	"numero_banco" varchar(20) NOT NULL,
	"nome_banco" varchar(255) NOT NULL,
	"tipo_conta" "bank_account_type" NOT NULL,
	"agencia" varchar(20) NOT NULL,
	"numero_conta" varchar(30) NOT NULL,
	"observacao" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_data" ADD CONSTRAINT "bank_data_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;