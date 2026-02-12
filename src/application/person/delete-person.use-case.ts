import type { IPersonRepository } from "../../domain/person/person.repository.js";

export class DeletePersonUseCase {
  constructor(private readonly repository: IPersonRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Pessoa não encontrada.");
    }
    await this.repository.delete(id);
  }
}
