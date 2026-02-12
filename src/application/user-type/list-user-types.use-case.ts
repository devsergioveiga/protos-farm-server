import type { IUserTypeRepository } from "../../domain/user-type/user-type.repository.js";

export class ListUserTypesUseCase {
  constructor(private readonly repository: IUserTypeRepository) {}

  async execute(input: { page?: number; limit?: number }) {
    return this.repository.list(input);
  }
}
