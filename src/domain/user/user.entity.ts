import { v4 as uuidv4 } from "uuid";

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly personId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    email: string,
    passwordHash: string,
    personId: string,
  ): User {
    const now = new Date();
    return new User(uuidv4(), email, passwordHash, personId, now, now);
  }

  static reconstitute(
    id: string,
    email: string,
    passwordHash: string,
    personId: string,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(
      id,
      email,
      passwordHash,
      personId,
      createdAt,
      updatedAt,
    );
  }
}
