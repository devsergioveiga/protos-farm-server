import type { Address } from "./address.entity.js";

export interface CreateAddressInput {
  personId: string;
  name: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  observacao?: string | null;
}

export interface UpdateAddressInput {
  name: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  observacao?: string | null;
}

export interface ListAddressesInput {
  personId: string;
  page?: number;
  limit?: number;
}

export interface ListAddressesResult {
  items: Address[];
  total: number;
  page: number;
  limit: number;
}

export interface IAddressRepository {
  create(address: Address): Promise<Address>;
  findById(id: string): Promise<Address | null>;
  list(input: ListAddressesInput): Promise<ListAddressesResult>;
  update(address: Address): Promise<Address>;
  delete(id: string): Promise<void>;
}
