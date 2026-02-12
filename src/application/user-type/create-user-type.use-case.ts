import { UserType } from "../../domain/user-type/user-type.entity.js";
import type { IUserTypeRepository } from "../../domain/user-type/user-type.repository.js";

export interface CreateUserTypeInput {
  name: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export class CreateUserTypeUseCase {
  constructor(private readonly repository: IUserTypeRepository) {}

  async execute(input: CreateUserTypeInput): Promise<UserType> {
    const slug = (input.slug?.trim() || slugify(input.name)).toLowerCase();
    if (!slug) {
      throw new Error("Slug inválido. Informe um slug ou um nome válido.");
    }

    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new Error("Já existe um tipo de usuário com este slug.");
    }

    const userType = UserType.create(input.name.trim(), slug, false);
    return this.repository.create(userType);
  }
}
