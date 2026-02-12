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
  organizationId?: string | null;
}

export interface UserListItem {
  id: string;
  email: string;
  personId: string;
  personName: string;
  userTypeId: string;
  userTypeName: string;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListUsersResult {
  items: UserListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UserWithOrganization {
  user: User;
  organizationId: string;
}

export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByIdWithOrganization(id: string): Promise<UserWithOrganization | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithOrganization(
    email: string,
  ): Promise<UserWithOrganization | null>;
  findByPersonId(personId: string): Promise<User | null>;
  list(input: ListUsersInput): Promise<ListUsersResult>;
}
