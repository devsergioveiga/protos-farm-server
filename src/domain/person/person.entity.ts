import { v4 as uuidv4 } from "uuid";
import type { PersonType } from "./person-type.vo.js";
import type { Role } from "./role.vo.js";
import { Document } from "./document.vo.js";

export class Person {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly personType: PersonType,
    public readonly documentNumber: string,
    public readonly organizationId: string,
    public readonly roles: Role[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    name: string,
    personType: PersonType,
    documentNumber: string,
    organizationId: string,
    roles: Role[] = [],
  ): Person {
    const doc = Document.create(documentNumber, personType);
    const now = new Date();
    return new Person(
      uuidv4(),
      name,
      personType,
      doc.raw,
      organizationId,
      roles,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    name: string,
    personType: PersonType,
    documentNumber: string,
    organizationId: string,
    roles: Role[],
    createdAt: Date,
    updatedAt: Date,
  ): Person {
    return new Person(
      id,
      name,
      personType,
      documentNumber,
      organizationId,
      roles,
      createdAt,
      updatedAt,
    );
  }

  update(name: string, documentNumber: string, roles: Role[]): Person {
    const doc = Document.create(documentNumber, this.personType);
    return new Person(
      this.id,
      name,
      this.personType,
      doc.raw,
      this.organizationId,
      roles,
      this.createdAt,
      new Date(),
    );
  }
}
