import { Organization } from "../../domain/organization/organization.entity.js";
import type { IOrganizationRepository } from "../../domain/organization/organization.repository.js";

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  isActive?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export class CreateOrganizationUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(input: CreateOrganizationInput): Promise<Organization> {
    const slug = input.slug.trim() || slugify(input.name);
    if (!slug) {
      throw new Error("Slug inválido. Informe um slug ou um nome válido.");
    }

    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new Error("Já existe uma organização com este slug.");
    }

    const isActive = input.isActive ?? true;
    const organization = Organization.create(input.name.trim(), slug, isActive);

    return this.repository.create(organization);
  }
}
