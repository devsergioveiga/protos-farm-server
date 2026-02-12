import { Organization } from "../../domain/organization/organization.entity.js";
import type {
  IOrganizationRepository,
  UpdateOrganizationInput as RepoInput,
} from "../../domain/organization/organization.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface UpdateOrganizationInput extends RepoInput {
  id: string;
}

export interface UpdateOrganizationContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export class UpdateOrganizationUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(
    input: UpdateOrganizationInput,
    context?: UpdateOrganizationContext,
  ): Promise<Organization> {
    const existing = await this.repository.findById(input.id);
    if (!existing) {
      throw new Error("Organização não encontrada.");
    }

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (existing.id !== context.requesterOrganizationId) {
          throw new Error("Acesso negado a esta organização.");
        }
      }
    }

    const slug = input.slug.trim() || slugify(input.name);
    if (!slug) {
      throw new Error("Slug inválido. Informe um slug ou um nome válido.");
    }

    const existingBySlug = await this.repository.findBySlug(slug);
    if (existingBySlug && existingBySlug.id !== input.id) {
      throw new Error("Já existe outra organização com este slug.");
    }

    const updated = Organization.reconstitute(
      input.id,
      input.name.trim(),
      slug,
      input.isActive,
      existing.createdAt,
      new Date(),
    );

    return this.repository.update(updated);
  }
}
