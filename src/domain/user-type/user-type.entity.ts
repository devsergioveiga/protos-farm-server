import { v4 as uuidv4 } from "uuid";

export class UserType {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly isSystem: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(name: string, slug: string, isSystem: boolean = false): UserType {
    const now = new Date();
    return new UserType(uuidv4(), name, slug, isSystem, now, now);
  }

  static reconstitute(
    id: string,
    name: string,
    slug: string,
    isSystem: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): UserType {
    return new UserType(id, name, slug, isSystem, createdAt, updatedAt);
  }

  canBeDeleted(): boolean {
    return !this.isSystem;
  }

  update(name: string, slug: string): UserType {
    return new UserType(
      this.id,
      name,
      slug,
      this.isSystem,
      this.createdAt,
      new Date(),
    );
  }
}
