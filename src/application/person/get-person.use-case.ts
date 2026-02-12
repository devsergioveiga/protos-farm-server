import type { Person } from "../../domain/person/person.entity.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";

export class GetPersonUseCase {
  constructor(private readonly repository: IPersonRepository) {}

  async execute(id: string): Promise<Person | null> {
    return this.repository.findById(id);
  }
}
