import type { Organization } from "./organization.entity.js";

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  isActive?: boolean;
}

export interface ListOrganizationsInput {
  page?: number;
  limit?: number;
}

export interface ListOrganizationsResult {
  items: Organization[];
  total: number;
  page: number;
  limit: number;
}

export interface IOrganizationRepository {
  create(organization: Organization): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  list(input: ListOrganizationsInput): Promise<ListOrganizationsResult>;
}
