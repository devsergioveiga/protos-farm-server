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
]);

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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  personId: uuid("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
