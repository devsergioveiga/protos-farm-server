import { v4 as uuidv4 } from "uuid";
import type { BankAccountType } from "./bank-account-type.vo.js";

export class BankData {
  private constructor(
    public readonly id: string,
    public readonly personId: string,
    public readonly identificacao: string,
    public readonly numeroBanco: string,
    public readonly nomeBanco: string,
    public readonly tipoConta: BankAccountType,
    public readonly agencia: string,
    public readonly numeroConta: string,
    public readonly observacao: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    personId: string,
    identificacao: string,
    numeroBanco: string,
    nomeBanco: string,
    tipoConta: BankAccountType,
    agencia: string,
    numeroConta: string,
    observacao?: string | null,
  ): BankData {
    const now = new Date();
    return new BankData(
      uuidv4(),
      personId,
      identificacao,
      numeroBanco,
      nomeBanco,
      tipoConta,
      agencia,
      numeroConta,
      observacao ?? null,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    personId: string,
    identificacao: string,
    numeroBanco: string,
    nomeBanco: string,
    tipoConta: BankAccountType,
    agencia: string,
    numeroConta: string,
    observacao: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): BankData {
    return new BankData(
      id,
      personId,
      identificacao,
      numeroBanco,
      nomeBanco,
      tipoConta,
      agencia,
      numeroConta,
      observacao,
      createdAt,
      updatedAt,
    );
  }

  update(
    identificacao: string,
    numeroBanco: string,
    nomeBanco: string,
    tipoConta: BankAccountType,
    agencia: string,
    numeroConta: string,
    observacao?: string | null,
  ): BankData {
    const obs = observacao === undefined ? this.observacao : observacao;
    return new BankData(
      this.id,
      this.personId,
      identificacao,
      numeroBanco,
      nomeBanco,
      tipoConta,
      agencia,
      numeroConta,
      obs,
      this.createdAt,
      new Date(),
    );
  }
}
