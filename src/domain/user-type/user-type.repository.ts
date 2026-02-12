import type { UserType } from "./user-type.entity.js";

export interface CreateUserTypeInput {
  name: string;
  slug: string;
  isSystem?: boolean;
}

export interface UpdateUserTypeInput {
  name?: string;
  slug?: string;
}

export interface ListUserTypesInput {
  page?: number;
  limit?: number;
}

export interface ListUserTypesResult {
  items: UserType[];
  total: number;
  page: number;
  limit: number;
}

export interface IUserTypeRepository {
  create(userType: UserType): Promise<UserType>;
  findById(id: string): Promise<UserType | null>;
  findBySlug(slug: string): Promise<UserType | null>;
  list(input: ListUserTypesInput): Promise<ListUserTypesResult>;
  update(userType: UserType): Promise<UserType>;
  delete(id: string): Promise<void>;
}
