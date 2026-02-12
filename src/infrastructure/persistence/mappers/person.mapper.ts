import { Person } from "../../../domain/person/person.entity.js";
import type { PersonType } from "../../../domain/person/person-type.vo.js";
import type { Role } from "../../../domain/person/role.vo.js";

export interface PersonRow {
  id: string;
  name: string;
  personType: PersonType;
  documentNumber: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonRoleRow {
  personId: string;
  role: Role;
}

export function toDomain(row: PersonRow, roles: Role[]): Person {
  return Person.reconstitute(
    row.id,
    row.name,
    row.personType,
    row.documentNumber,
    row.organizationId,
    roles,
    row.createdAt,
    row.updatedAt,
  );
}

export function toPersistence(person: Person) {
  return {
    id: person.id,
    name: person.name,
    personType: person.personType,
    documentNumber: person.documentNumber,
    organizationId: person.organizationId,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  };
}
