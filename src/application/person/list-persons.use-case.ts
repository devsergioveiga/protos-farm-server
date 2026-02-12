import type {
  IPersonRepository,
  ListPersonsInput,
  ListPersonsResult,
} from "../../domain/person/person.repository.js";

export class ListPersonsUseCase {
  constructor(private readonly repository: IPersonRepository) {}

  async execute(input: ListPersonsInput): Promise<ListPersonsResult> {
    return this.repository.list(input);
  }
}
