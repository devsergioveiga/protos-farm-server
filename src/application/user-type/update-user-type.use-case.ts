import type { UserType } from "../../domain/user-type/user-type.entity.js";
import type { IUserTypeRepository } from "../../domain/user-type/user-type.repository.js";

export interface UpdateUserTypeInput {
  name?: string;
  slug?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export class UpdateUserTypeUseCase {
  constructor(private readonly repository: IUserTypeRepository) {}

  async execute(id: string, input: UpdateUserTypeInput): Promise<UserType> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Tipo de usuário não encontrado.");
    }

    const name = input.name?.trim() ?? existing.name;
    const slug = input.slug?.trim()
      ? input.slug.toLowerCase()
      : slugify(input.name ?? existing.name);

    if (!slug) {
      throw new Error("Slug inválido.");
    }

    if (slug !== existing.slug) {
      const bySlug = await this.repository.findBySlug(slug);
      if (bySlug && bySlug.id !== id) {
        throw new Error("Já existe um tipo de usuário com este slug.");
      }
      if (existing.isSystem) {
        throw new Error("Não é possível alterar o slug de um tipo de sistema.");
      }
    }

    const updated = existing.update(name, slug);
    return this.repository.update(updated);
  }
}
