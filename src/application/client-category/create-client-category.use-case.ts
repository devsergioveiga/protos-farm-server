import { ClientCategory } from "../../domain/client-category/client-category.entity.js";
import type { IClientCategoryRepository } from "../../domain/client-category/client-category.repository.js";

export interface CreateClientCategoryInput {
  name: string;
  description?: string | null;
  organizationId: string;
}

export class CreateClientCategoryUseCase {
  constructor(private readonly repository: IClientCategoryRepository) {}

  async execute(input: CreateClientCategoryInput): Promise<ClientCategory> {
    const name = input.name.trim();
    if (!name) {
      throw new Error("Informe o nome da categoria.");
    }

    const clientCategory = ClientCategory.create(
      name,
      input.organizationId,
      input.description?.trim() || null,
    );
    return this.repository.create(clientCategory);
  }
}
