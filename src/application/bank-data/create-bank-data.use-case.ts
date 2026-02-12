import { BankData } from "../../domain/bank-data/bank-data.entity.js";
import type { IBankDataRepository } from "../../domain/bank-data/bank-data.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import {
  isBankAccountType,
  type BankAccountType,
} from "../../domain/bank-data/bank-account-type.vo.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface CreateBankDataInput {
  personId: string;
  identificacao: string;
  numeroBanco: string;
  nomeBanco: string;
  tipoConta: string;
  agencia: string;
  numeroConta: string;
  observacao?: string | null;
}

export interface CreateBankDataContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class CreateBankDataUseCase {
  constructor(
    private readonly repository: IBankDataRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    input: CreateBankDataInput,
    context?: CreateBankDataContext,
  ): Promise<BankData> {
    const person = await this.personRepository.findById(input.personId);
    if (!person) {
      throw new Error("Pessoa não encontrada.");
    }

    if (context) {
      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (person.organizationId !== context.requesterOrganizationId) {
          throw new Error("Acesso negado a esta pessoa.");
        }
      }
    }

    if (!isBankAccountType(input.tipoConta)) {
      throw new Error(
        "Tipo de conta inválido. Use: CONTA_CORRENTE, CONTA_POUPANCA ou CONTA_INVESTIMENTO.",
      );
    }

    const identificacao = input.identificacao.trim();
    if (!identificacao) {
      throw new Error("Informe a identificação da conta.");
    }

    const bankData = BankData.create(
      input.personId,
      identificacao,
      input.numeroBanco.trim(),
      input.nomeBanco.trim(),
      input.tipoConta as BankAccountType,
      input.agencia.trim(),
      input.numeroConta.trim(),
      input.observacao?.trim() || null,
    );
    return this.repository.create(bankData);
  }
}
