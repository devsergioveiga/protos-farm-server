import type { Person } from "./person.entity.js";

export interface CreatePersonInput {
  name: string;
  personType: "PF" | "PJ";
  documentNumber: string;
  organizationId: string;
  roles: ("USER" | "CLIENT" | "SUPPLIER" | "EMPLOYEE")[];
}

export interface UpdatePersonInput {
  name: string;
  documentNumber: string;
  roles: ("USER" | "CLIENT" | "SUPPLIER" | "EMPLOYEE")[];
}

export interface ListPersonsInput {
  page?: number;
  limit?: number;
  organizationId?: string | null;
}

export interface ListPersonsResult {
  items: Person[];
  total: number;
  page: number;
  limit: number;
}

export interface IPersonRepository {
  create(person: Person): Promise<Person>;
  findById(id: string): Promise<Person | null>;
  findByDocument(documentNumber: string): Promise<Person | null>;
  list(input: ListPersonsInput): Promise<ListPersonsResult>;
  update(person: Person): Promise<Person>;
  delete(id: string): Promise<void>;
}
