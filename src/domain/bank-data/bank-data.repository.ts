import type { BankData } from "./bank-data.entity.js";

export interface CreateBankDataInput {
  personId: string;
  identificacao: string;
  numeroBanco: string;
  nomeBanco: string;
  tipoConta: "CONTA_CORRENTE" | "CONTA_POUPANCA" | "CONTA_INVESTIMENTO";
  agencia: string;
  numeroConta: string;
  observacao?: string | null;
}

export interface UpdateBankDataInput {
  identificacao: string;
  numeroBanco: string;
  nomeBanco: string;
  tipoConta: "CONTA_CORRENTE" | "CONTA_POUPANCA" | "CONTA_INVESTIMENTO";
  agencia: string;
  numeroConta: string;
  observacao?: string | null;
}

export interface ListBankDataInput {
  personId: string;
  page?: number;
  limit?: number;
}

export interface ListBankDataResult {
  items: BankData[];
  total: number;
  page: number;
  limit: number;
}

export interface IBankDataRepository {
  create(bankData: BankData): Promise<BankData>;
  findById(id: string): Promise<BankData | null>;
  list(input: ListBankDataInput): Promise<ListBankDataResult>;
  update(bankData: BankData): Promise<BankData>;
  delete(id: string): Promise<void>;
}
