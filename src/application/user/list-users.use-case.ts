import type { IUserRepository } from "../../domain/user/user.repository.js";

export class ListUsersUseCase {
  constructor(private readonly repository: IUserRepository) {}

  async execute(input: { page?: number; limit?: number }) {
    return this.repository.list(input);
  }
}
