import { v4 as uuidv4 } from "uuid";

export class Address {
  private constructor(
    public readonly id: string,
    public readonly personId: string,
    public readonly name: string,
    public readonly logradouro: string,
    public readonly numero: string,
    public readonly bairro: string,
    public readonly cep: string,
    public readonly cidade: string,
    public readonly uf: string,
    public readonly observacao: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    personId: string,
    name: string,
    logradouro: string,
    numero: string,
    bairro: string,
    cep: string,
    cidade: string,
    uf: string,
    observacao?: string | null,
  ): Address {
    const now = new Date();
    return new Address(
      uuidv4(),
      personId,
      name,
      logradouro,
      numero,
      bairro,
      cep,
      cidade,
      uf,
      observacao ?? null,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    personId: string,
    name: string,
    logradouro: string,
    numero: string,
    bairro: string,
    cep: string,
    cidade: string,
    uf: string,
    observacao: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): Address {
    return new Address(
      id,
      personId,
      name,
      logradouro,
      numero,
      bairro,
      cep,
      cidade,
      uf,
      observacao,
      createdAt,
      updatedAt,
    );
  }

  update(
    name: string,
    logradouro: string,
    numero: string,
    bairro: string,
    cep: string,
    cidade: string,
    uf: string,
    observacao?: string | null,
  ): Address {
    const obs = observacao === undefined ? this.observacao : observacao;
    return new Address(
      this.id,
      this.personId,
      name,
      logradouro,
      numero,
      bairro,
      cep,
      cidade,
      uf,
      obs,
      this.createdAt,
      new Date(),
    );
  }
}
