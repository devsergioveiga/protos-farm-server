import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { SYSTEM_USER_TYPE_IDS } from "../../../domain/user-type/system-user-types.js";
import { db } from "./client.js";
import { organizations, persons, userTypes, users } from "./schema.js";

const DEFAULT_ORG_SLUG = "organizacao-padrao";

const SALT_ROUNDS = 10;

const SYSTEM_USER_TYPES = [
  { id: SYSTEM_USER_TYPE_IDS.SUPER_ADMIN, name: "Super Admin", slug: "super_admin", isSystem: true },
  { id: SYSTEM_USER_TYPE_IDS.ORG_ADMIN, name: "Org Admin", slug: "org_admin", isSystem: true },
  { id: SYSTEM_USER_TYPE_IDS.USER, name: "User", slug: "user", isSystem: true },
] as const;

const SUPER_ADMIN_CPF = "015.066.106-17";
const SUPER_ADMIN_EMAIL = "dev.sergio.veiga@gmail.com";

export async function seedUserTypes(): Promise<void> {
  for (const type of SYSTEM_USER_TYPES) {
    const [existing] = await db
      .select()
      .from(userTypes)
      .where(eq(userTypes.slug, type.slug));

    if (!existing) {
      await db.insert(userTypes).values({
        id: type.id,
        name: type.name,
        slug: type.slug,
        isSystem: type.isSystem,
      });
      console.log(`Seed: user type "${type.slug}" created`);
    }
  }
}

export async function seedSuperAdminUser(): Promise<void> {
  const [defaultOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, DEFAULT_ORG_SLUG));
  if (!defaultOrg) {
    throw new Error(
      `Default organization (${DEFAULT_ORG_SLUG}) not found. Run migrations first.`,
    );
  }

  const [existingPerson] = await db
    .select()
    .from(persons)
    .where(eq(persons.documentNumber, SUPER_ADMIN_CPF));

  let personId: string;
  if (existingPerson) {
    personId = existingPerson.id;
  } else {
    const [inserted] = await db
      .insert(persons)
      .values({
        name: "Sergio Rubens Veiga Soares",
        personType: "PF",
        documentNumber: SUPER_ADMIN_CPF,
        organizationId: defaultOrg.id,
      })
      .returning({ id: persons.id });
    if (!inserted) throw new Error("Failed to create super admin person");
    personId = inserted.id;
    console.log(`Seed: super admin person created`);
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, SUPER_ADMIN_EMAIL));

  if (!existingUser) {
    const passwordHash = await bcrypt.hash("Protos3228@", SALT_ROUNDS);
    await db.insert(users).values({
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      personId,
      userTypeId: SYSTEM_USER_TYPE_IDS.SUPER_ADMIN,
      organizationId: null,
    });
    console.log(`Seed: super admin user created (${SUPER_ADMIN_EMAIL})`);
  }
}
