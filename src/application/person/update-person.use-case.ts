import type { Person } from "../../domain/person/person.entity.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import type { IClientCategoryRepository } from "../../domain/client-category/client-category.repository.js";
import type { ISupplierCategoryRepository } from "../../domain/supplier-category/supplier-category.repository.js";
import { isRole } from "../../domain/person/role.vo.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface UpdatePersonInput {
  name: string;
  documentNumber: string;
  roles?: string[];
  clientCategoryId?: string | null;
  supplierCategoryId?: string | null;
  tradeName?: string | null;
}

export interface UpdatePersonContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class UpdatePersonUseCase {
  constructor(
    private readonly repository: IPersonRepository,
    private readonly clientCategoryRepository?: IClientCategoryRepository,
    private readonly supplierCategoryRepository?: ISupplierCategoryRepository,
  ) {}

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

    let clientCategoryId = input.clientCategoryId ?? existing.clientCategoryId;
    let supplierCategoryId =
      input.supplierCategoryId ?? existing.supplierCategoryId;

    if (!roles.includes("CLIENT")) {
      clientCategoryId = null;
    } else if (clientCategoryId && this.clientCategoryRepository) {
      const cat =
        await this.clientCategoryRepository.findById(clientCategoryId);
      if (!cat || cat.organizationId !== existing.organizationId) {
        throw new Error(
          "Categoria de cliente inválida ou não pertence à organização.",
        );
      }
    }

    if (!roles.includes("SUPPLIER")) {
      supplierCategoryId = null;
    } else if (supplierCategoryId && this.supplierCategoryRepository) {
      const cat =
        await this.supplierCategoryRepository.findById(supplierCategoryId);
      if (!cat || cat.organizationId !== existing.organizationId) {
        throw new Error(
          "Categoria de fornecedor inválida ou não pertence à organização.",
        );
      }
    }

    const updated = existing.update(
      input.name,
      input.documentNumber,
      roles,
      clientCategoryId,
      supplierCategoryId,
      input.tradeName,
    );

    return this.repository.update(updated);
  }
}
