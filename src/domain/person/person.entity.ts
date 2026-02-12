import { v4 as uuidv4 } from "uuid";
import type { PersonType } from "./person-type.vo.js";
import type { Role } from "./role.vo.js";
import { Document } from "./document.vo.js";

export class Person {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly tradeName: string | null,
    public readonly personType: PersonType,
    public readonly documentNumber: string,
    public readonly organizationId: string,
    public readonly roles: Role[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly clientCategoryId: string | null,
    public readonly supplierCategoryId: string | null,
  ) {}

  static create(
    name: string,
    personType: PersonType,
    documentNumber: string,
    organizationId: string,
    roles: Role[] = [],
    clientCategoryId?: string | null,
    supplierCategoryId?: string | null,
    tradeName?: string | null,
  ): Person {
    const doc = Document.create(documentNumber, personType);
    const now = new Date();
    return new Person(
      uuidv4(),
      name,
      tradeName ?? null,
      personType,
      doc.raw,
      organizationId,
      roles,
      now,
      now,
      clientCategoryId ?? null,
      supplierCategoryId ?? null,
    );
  }

  static reconstitute(
    id: string,
    name: string,
    tradeName: string | null,
    personType: PersonType,
    documentNumber: string,
    organizationId: string,
    roles: Role[],
    createdAt: Date,
    updatedAt: Date,
    clientCategoryId: string | null,
    supplierCategoryId: string | null,
  ): Person {
    return new Person(
      id,
      name,
      tradeName,
      personType,
      documentNumber,
      organizationId,
      roles,
      createdAt,
      updatedAt,
      clientCategoryId,
      supplierCategoryId,
    );
  }

  update(
    name: string,
    documentNumber: string,
    roles: Role[],
    clientCategoryId?: string | null,
    supplierCategoryId?: string | null,
    tradeName?: string | null,
  ): Person {
    const doc = Document.create(documentNumber, this.personType);
    const effectiveClientCat =
      clientCategoryId !== undefined ? clientCategoryId : this.clientCategoryId;
    const effectiveSupplierCat =
      supplierCategoryId !== undefined
        ? supplierCategoryId
        : this.supplierCategoryId;
    const effectiveTradeName =
      tradeName !== undefined ? tradeName : this.tradeName;
    return new Person(
      this.id,
      name,
      effectiveTradeName,
      this.personType,
      doc.raw,
      this.organizationId,
      roles,
      this.createdAt,
      new Date(),
      roles.includes("CLIENT") ? effectiveClientCat : null,
      roles.includes("SUPPLIER") ? effectiveSupplierCat : null,
    );
  }
}
