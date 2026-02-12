import { v4 as uuidv4 } from "uuid";

export class Organization {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    name: string,
    slug: string,
    isActive: boolean = true,
  ): Organization {
    const now = new Date();
    return new Organization(uuidv4(), name, slug, isActive, now, now);
  }

  static reconstitute(
    id: string,
    name: string,
    slug: string,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): Organization {
    return new Organization(id, name, slug, isActive, createdAt, updatedAt);
  }
}
