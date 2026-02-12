import type { UserType } from "../../domain/user-type/user-type.entity.js";
import type { IUserTypeRepository } from "../../domain/user-type/user-type.repository.js";

export class GetUserTypeUseCase {
  constructor(private readonly repository: IUserTypeRepository) {}

  async execute(id: string): Promise<UserType | null> {
    return this.repository.findById(id);
  }
}
