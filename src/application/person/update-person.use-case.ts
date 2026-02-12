import type { Person } from "../../domain/person/person.entity.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { isRole } from "../../domain/person/role.vo.js";

export interface UpdatePersonInput {
  name: string;
  documentNumber: string;
  roles?: string[];
}

export class UpdatePersonUseCase {
  constructor(private readonly repository: IPersonRepository) {}

  async execute(id: string, input: UpdatePersonInput): Promise<Person> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Pessoa não encontrada.");
    }

    const sameDocument = await this.repository.findByDocument(
      input.documentNumber,
    );
    if (sameDocument && sameDocument.id !== id) {
      throw new Error("Já existe outra pessoa com este documento.");
    }

    const roles = (input.roles ?? []).filter((r) => isRole(r));

    const updated = existing.update(input.name, input.documentNumber, roles);

    return this.repository.update(updated);
  }
}
