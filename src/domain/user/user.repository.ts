import type { User } from "./user.entity.js";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  personId: string;
}

export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPersonId(personId: string): Promise<User | null>;
}
