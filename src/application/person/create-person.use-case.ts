import { Person } from "../../domain/person/person.entity.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import type { IClientCategoryRepository } from "../../domain/client-category/client-category.repository.js";
import type { ISupplierCategoryRepository } from "../../domain/supplier-category/supplier-category.repository.js";
import { isPersonType } from "../../domain/person/person-type.vo.js";
import { isRole } from "../../domain/person/role.vo.js";

export interface CreatePersonInput {
  name: string;
  personType: string;
  documentNumber: string;
  organizationId: string;
  roles?: string[];
  clientCategoryId?: string | null;
  supplierCategoryId?: string | null;
  tradeName?: string | null;
}

export class CreatePersonUseCase {
  constructor(
    private readonly repository: IPersonRepository,
    private readonly clientCategoryRepository?: IClientCategoryRepository,
    private readonly supplierCategoryRepository?: ISupplierCategoryRepository,
  ) {}

  async execute(input: CreatePersonInput): Promise<Person> {
    if (!isPersonType(input.personType)) {
      throw new Error("Tipo de pessoa inválido. Use PF ou PJ.");
    }

    const roles = (input.roles ?? []).filter((r) => isRole(r));

    const existing = await this.repository.findByDocument(input.documentNumber);
    if (existing) {
      throw new Error("Já existe uma pessoa com este documento.");
    }

    let clientCategoryId = input.clientCategoryId ?? null;
    let supplierCategoryId = input.supplierCategoryId ?? null;

    if (clientCategoryId && this.clientCategoryRepository) {
      const cat = await this.clientCategoryRepository.findById(clientCategoryId);
      if (!cat || cat.organizationId !== input.organizationId) {
        throw new Error(
          "Categoria de cliente inválida ou não pertence à organização.",
        );
      }
    } else if (clientCategoryId) {
      clientCategoryId = null;
    }

    if (supplierCategoryId && this.supplierCategoryRepository) {
      const cat =
        await this.supplierCategoryRepository.findById(supplierCategoryId);
      if (!cat || cat.organizationId !== input.organizationId) {
        throw new Error(
          "Categoria de fornecedor inválida ou não pertence à organização.",
        );
      }
    } else if (supplierCategoryId) {
      supplierCategoryId = null;
    }

    const person = Person.create(
      input.name,
      input.personType,
      input.documentNumber,
      input.organizationId,
      roles,
      clientCategoryId,
      supplierCategoryId,
      input.tradeName,
    );

    return this.repository.create(person);
  }
}
