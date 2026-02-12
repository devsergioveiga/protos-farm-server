import type { User } from "../../domain/user/user.entity.js";
import type { IUserRepository } from "../../domain/user/user.repository.js";

export class GetUserUseCase {
  constructor(private readonly repository: IUserRepository) {}

  async execute(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }
}
