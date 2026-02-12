import type {
  IUserRepository,
  ListUsersInput,
  ListUsersResult,
} from "../../domain/user/user.repository.js";

export class ListUsersUseCase {
  constructor(private readonly repository: IUserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersResult> {
    return this.repository.list(input);
  }
}
