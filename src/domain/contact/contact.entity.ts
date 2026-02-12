import { v4 as uuidv4 } from "uuid";

export class Contact {
  private constructor(
    public readonly id: string,
    public readonly personId: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly descricao: string | null,
    public readonly observacao: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    personId: string,
    name: string,
    phone: string,
    descricao?: string | null,
    observacao?: string | null,
  ): Contact {
    const now = new Date();
    return new Contact(
      uuidv4(),
      personId,
      name,
      phone,
      descricao ?? null,
      observacao ?? null,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    personId: string,
    name: string,
    phone: string,
    descricao: string | null,
    observacao: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): Contact {
    return new Contact(
      id,
      personId,
      name,
      phone,
      descricao,
      observacao,
      createdAt,
      updatedAt,
    );
  }

  update(
    name: string,
    phone: string,
    descricao?: string | null,
    observacao?: string | null,
  ): Contact {
    const desc = descricao === undefined ? this.descricao : descricao;
    const obs = observacao === undefined ? this.observacao : observacao;
    return new Contact(
      this.id,
      this.personId,
      name,
      phone,
      desc,
      obs,
      this.createdAt,
      new Date(),
    );
  }
}
