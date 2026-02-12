import { v4 as uuidv4 } from "uuid";

export class ClientCategory {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly organizationId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    name: string,
    organizationId: string,
    description?: string | null,
  ): ClientCategory {
    const now = new Date();
    return new ClientCategory(
      uuidv4(),
      name,
      description ?? null,
      organizationId,
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    name: string,
    description: string | null,
    organizationId: string,
    createdAt: Date,
    updatedAt: Date,
  ): ClientCategory {
    return new ClientCategory(
      id,
      name,
      description,
      organizationId,
      createdAt,
      updatedAt,
    );
  }

  update(name: string, description?: string | null): ClientCategory {
    const desc = description === undefined ? this.description : description;
    return new ClientCategory(
      this.id,
      name,
      desc,
      this.organizationId,
      this.createdAt,
      new Date(),
    );
  }
}
