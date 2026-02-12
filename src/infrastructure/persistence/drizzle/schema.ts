import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  primaryKey,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const personTypeEnum = pgEnum("person_type", ["PF", "PJ"]);
export const roleEnum = pgEnum("role", [
  "USER",
  "CLIENT",
  "SUPPLIER",
  "EMPLOYEE",
  "MANUFACTURER",
  "FARM_OWNER",
]);

export const permissionActionEnum = pgEnum("permission_action", [
  "create",
  "read",
  "update",
  "delete",
]);

export const bankAccountTypeEnum = pgEnum("bank_account_type", [
  "CONTA_CORRENTE",
  "CONTA_POUPANCA",
  "CONTA_INVESTIMENTO",
]);

export const userTypes = pgTable("user_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const persons = pgTable("persons", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  personType: personTypeEnum("person_type").notNull(),
  documentNumber: varchar("document_number", { length: 14 }).notNull().unique(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const personRoles = pgTable(
  "person_roles",
  {
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.role] })],
);

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  descricao: varchar("descricao", { length: 500 }),
  observacao: varchar("observacao", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  logradouro: varchar("logradouro", { length: 255 }).notNull(),
  numero: varchar("numero", { length: 50 }).notNull(),
  bairro: varchar("bairro", { length: 255 }).notNull(),
  cep: varchar("cep", { length: 10 }).notNull(),
  cidade: varchar("cidade", { length: 255 }).notNull(),
  uf: varchar("uf", { length: 2 }).notNull(),
  observacao: varchar("observacao", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bankData = pgTable("bank_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  identificacao: varchar("identificacao", { length: 255 }).notNull(),
  numeroBanco: varchar("numero_banco", { length: 20 }).notNull(),
  nomeBanco: varchar("nome_banco", { length: 255 }).notNull(),
  tipoConta: bankAccountTypeEnum("tipo_conta").notNull(),
  agencia: varchar("agencia", { length: 20 }).notNull(),
  numeroConta: varchar("numero_conta", { length: 30 }).notNull(),
  observacao: varchar("observacao", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clientCategories = pgTable("client_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supplierCategories = pgTable("supplier_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  personId: uuid("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  userTypeId: uuid("user_type_id")
    .notNull()
    .references(() => userTypes.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** RBAC: permissões por tipo de usuário e organização. Recurso + ação (create, read, update, delete). */
export const permissions = pgTable(
  "permissions",
  {
    userTypeId: uuid("user_type_id")
      .notNull()
      .references(() => userTypes.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    resource: varchar("resource", { length: 64 }).notNull(),
    action: permissionActionEnum("action").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      columns: [t.userTypeId, t.organizationId, t.resource, t.action],
    }),
  ],
);
