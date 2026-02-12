import type { User } from "./user.entity.js";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  personId: string;
  userTypeId: string;
}

export interface ListUsersInput {
  page?: number;
  limit?: number;
}

export interface UserListItem {
  id: string;
  email: string;
  personId: string;
  personName: string;
  userTypeId: string;
  userTypeName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListUsersResult {
  items: UserListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPersonId(personId: string): Promise<User | null>;
  list(input: ListUsersInput): Promise<ListUsersResult>;
}
