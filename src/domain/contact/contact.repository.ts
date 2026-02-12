import type { Contact } from "./contact.entity.js";

export interface CreateContactInput {
  personId: string;
  name: string;
  phone: string;
  descricao?: string | null;
  observacao?: string | null;
}

export interface UpdateContactInput {
  name: string;
  phone: string;
  descricao?: string | null;
  observacao?: string | null;
}

export interface ListContactsInput {
  personId: string;
  page?: number;
  limit?: number;
}

export interface ListContactsResult {
  items: Contact[];
  total: number;
  page: number;
  limit: number;
}

export interface IContactRepository {
  create(contact: Contact): Promise<Contact>;
  findById(id: string): Promise<Contact | null>;
  list(input: ListContactsInput): Promise<ListContactsResult>;
  update(contact: Contact): Promise<Contact>;
  delete(id: string): Promise<void>;
}
