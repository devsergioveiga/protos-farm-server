import type {
  IOrganizationRepository,
  ListOrganizationsInput,
  ListOrganizationsResult,
} from "../../domain/organization/organization.repository.js";

export class ListOrganizationsUseCase {
  constructor(private readonly repository: IOrganizationRepository) {}

  async execute(
    input: ListOrganizationsInput,
  ): Promise<ListOrganizationsResult> {
    return this.repository.list(input);
  }
}
