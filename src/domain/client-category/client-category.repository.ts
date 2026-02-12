import type { ClientCategory } from "./client-category.entity.js";

export interface CreateClientCategoryInput {
  name: string;
  description?: string | null;
  organizationId: string;
}

export interface UpdateClientCategoryInput {
  name?: string;
  description?: string | null;
}

export interface ListClientCategoriesInput {
  page?: number;
  limit?: number;
  organizationId: string;
}

export interface ListClientCategoriesResult {
  items: ClientCategory[];
  total: number;
  page: number;
  limit: number;
}

export interface IClientCategoryRepository {
  create(clientCategory: ClientCategory): Promise<ClientCategory>;
  findById(id: string): Promise<ClientCategory | null>;
  list(input: ListClientCategoriesInput): Promise<ListClientCategoriesResult>;
  update(clientCategory: ClientCategory): Promise<ClientCategory>;
  delete(id: string): Promise<void>;
}
