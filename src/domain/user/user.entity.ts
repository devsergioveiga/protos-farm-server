import { v4 as uuidv4 } from "uuid";

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly personId: string,
    public readonly userTypeId: string,
    public readonly organizationId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    email: string,
    passwordHash: string,
    personId: string,
    userTypeId: string,
    organizationId: string | null,
  ): User {
    const now = new Date();
    return new User(
      uuidv4(),
      email,
      passwordHash,
      personId,
      userTypeId,
      organizationId,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    email: string,
    passwordHash: string,
    personId: string,
    userTypeId: string,
    organizationId: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(
      id,
      email,
      passwordHash,
      personId,
      userTypeId,
      organizationId,
      createdAt,
      updatedAt,
    );
  }
}
