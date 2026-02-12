import type {
  ISupplierCategoryRepository,
  ListSupplierCategoriesInput,
  ListSupplierCategoriesResult,
} from "../../domain/supplier-category/supplier-category.repository.js";

export class ListSupplierCategoriesUseCase {
  constructor(private readonly repository: ISupplierCategoryRepository) {}

  async execute(
    input: ListSupplierCategoriesInput,
  ): Promise<ListSupplierCategoriesResult> {
    return this.repository.list(input);
  }
}
