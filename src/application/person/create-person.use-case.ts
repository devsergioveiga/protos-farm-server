import { Person } from "../../domain/person/person.entity.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { isPersonType } from "../../domain/person/person-type.vo.js";
import { isRole } from "../../domain/person/role.vo.js";

export interface CreatePersonInput {
  name: string;
  personType: string;
  documentNumber: string;
  organizationId: string;
  roles?: string[];
}

export class CreatePersonUseCase {
  constructor(private readonly repository: IPersonRepository) {}

  async execute(input: CreatePersonInput): Promise<Person> {
    if (!isPersonType(input.personType)) {
      throw new Error("Tipo de pessoa inválido. Use PF ou PJ.");
    }

    const roles = (input.roles ?? []).filter((r) => isRole(r));

    const existing = await this.repository.findByDocument(input.documentNumber);
    if (existing) {
      throw new Error("Já existe uma pessoa com este documento.");
    }

    const person = Person.create(
      input.name,
      input.personType,
      input.documentNumber,
      input.organizationId,
      roles,
    );

    return this.repository.create(person);
  }
}
