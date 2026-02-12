import type { BankData } from "../../domain/bank-data/bank-data.entity.js";
import type { IBankDataRepository } from "../../domain/bank-data/bank-data.repository.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import type { UpdateBankDataInput } from "../../domain/bank-data/bank-data.repository.js";
import {
  isBankAccountType,
  type BankAccountType,
} from "../../domain/bank-data/bank-account-type.vo.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

export interface UpdateBankDataContext {
  requesterUserTypeId: string;
  requesterOrganizationId: string | null;
}

export class UpdateBankDataUseCase {
  constructor(
    private readonly repository: IBankDataRepository,
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateBankDataInput,
    context?: UpdateBankDataContext,
  ): Promise<BankData> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Dados bancários não encontrados.");
    }

    if (context) {
      const person = await this.personRepository.findById(existing.personId);
      if (!person) {
        throw new Error("Pessoa não encontrada.");
      }

      const isSuperAdmin =
        context.requesterUserTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
      if (!isSuperAdmin && context.requesterOrganizationId != null) {
        if (person.organizationId !== context.requesterOrganizationId) {
          throw new Error("Acesso negado a estes dados bancários.");
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

    const updated = existing.update(
      identificacao,
      input.numeroBanco.trim(),
      input.nomeBanco.trim(),
      input.tipoConta as BankAccountType,
      input.agencia.trim(),
      input.numeroConta.trim(),
      input.observacao?.trim() ?? existing.observacao,
    );
    return this.repository.update(updated);
  }
}
