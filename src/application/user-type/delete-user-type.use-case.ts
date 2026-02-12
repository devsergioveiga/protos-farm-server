import type { IUserTypeRepository } from "../../domain/user-type/user-type.repository.js";

export class DeleteUserTypeUseCase {
  constructor(private readonly repository: IUserTypeRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Tipo de usuário não encontrado.");
    }
    if (!existing.canBeDeleted()) {
      throw new Error("Tipos de sistema não podem ser apagados.");
    }
    await this.repository.delete(id);
  }
}
