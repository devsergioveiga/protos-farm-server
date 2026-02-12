import { User } from "../../../domain/user/user.entity.js";

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  personId: string;
  userTypeId: string;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toDomain(row: UserRow): User {
  return User.reconstitute(
    row.id,
    row.email,
    row.passwordHash,
    row.personId,
    row.userTypeId,
    row.organizationId ?? null,
    row.createdAt,
    row.updatedAt,
  );
}

export function toPersistence(user: User) {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    personId: user.personId,
    userTypeId: user.userTypeId,
    organizationId: user.organizationId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
