import type { Person } from "../../domain/person/person.entity.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import { isRole } from "../../domain/person/role.vo.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface UpdatePersonInput {
  name: string;
  documentNumber: string;
  roles?: string[];
}

export interface UpdatePersonContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class UpdatePersonUseCase {
  constructor(private readonly repository: IPersonRepository) {}

  async execute(
    id: string,
    input: UpdatePersonInput,
    context?: UpdatePersonContext,
  ): Promise<Person> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Pessoa não encontrada.");
    }

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (existing.organizationId !== context.requesterOrganizationId) {
          throw new Error("Acesso negado a esta pessoa.");
        }
      }
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
