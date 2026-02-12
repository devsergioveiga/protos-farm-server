import type {
  IClientCategoryRepository,
  ListClientCategoriesInput,
  ListClientCategoriesResult,
} from "../../domain/client-category/client-category.repository.js";

export class ListClientCategoriesUseCase {
  constructor(private readonly repository: IClientCategoryRepository) {}

  async execute(input: ListClientCategoriesInput): Promise<ListClientCategoriesResult> {
    return this.repository.list(input);
  }
}
