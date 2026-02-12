import { Person } from "../../../domain/person/person.entity.js";
import type { PersonType } from "../../../domain/person/person-type.vo.js";
import type { Role } from "../../../domain/person/role.vo.js";

export interface PersonRow {
  id: string;
  name: string;
  tradeName: string | null;
  personType: PersonType;
  documentNumber: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  clientCategoryId: string | null;
  supplierCategoryId: string | null;
}

export interface PersonRoleRow {
  personId: string;
  role: Role;
}

export function toDomain(row: PersonRow, roles: Role[]): Person {
  return Person.reconstitute(
    row.id,
    row.name,
    row.tradeName ?? null,
    row.personType,
    row.documentNumber,
    row.organizationId,
    roles,
    row.createdAt,
    row.updatedAt,
    row.clientCategoryId ?? null,
    row.supplierCategoryId ?? null,
  );
}

export function toPersistence(person: Person) {
  return {
    id: person.id,
    name: person.name,
    tradeName: person.tradeName,
    personType: person.personType,
    documentNumber: person.documentNumber,
    organizationId: person.organizationId,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
    clientCategoryId: person.clientCategoryId,
    supplierCategoryId: person.supplierCategoryId,
  };
}
