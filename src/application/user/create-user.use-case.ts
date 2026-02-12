import bcrypt from "bcrypt";
import { User } from "../../domain/user/user.entity.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import type { IUserRepository } from "../../domain/user/user.repository.js";
import type { IUserTypeRepository } from "../../domain/user-type/user-type.repository.js";
import type { IOrganizationRepository } from "../../domain/organization/organization.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";

const SALT_ROUNDS = 10;

export interface CreateUserInput {
  email: string;
  password: string;
  personId: string;
  userTypeId: string;
  organizationId: string | null;
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly personRepository: IPersonRepository,
    private readonly userTypeRepository: IUserTypeRepository,
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existingByEmail = await this.userRepository.findByEmail(
      input.email.toLowerCase().trim(),
    );
    if (existingByEmail) {
      throw new Error("Já existe um usuário com este e-mail.");
    }

    const existingByPerson = await this.userRepository.findByPersonId(
      input.personId,
    );
    if (existingByPerson) {
      throw new Error("Esta pessoa já possui um usuário vinculado.");
    }

    const person = await this.personRepository.findById(input.personId);
    if (!person) {
      throw new Error("Pessoa não encontrada.");
    }

    const userType = await this.userTypeRepository.findById(input.userTypeId);
    if (!userType) {
      throw new Error("Tipo de usuário não encontrado.");
    }

    const isSuperAdmin = input.userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN;
    const organizationId: string | null = isSuperAdmin
      ? null
      : input.organizationId;

    if (!isSuperAdmin) {
      if (!input.organizationId) {
        throw new Error("Organização é obrigatória para este tipo de usuário.");
      }
      const org = await this.organizationRepository.findById(
        input.organizationId,
      );
      if (!org) {
        throw new Error("Organização não encontrada.");
      }
      if (person.organizationId !== input.organizationId) {
        throw new Error(
          "A pessoa selecionada não pertence à organização informada.",
        );
      }
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const email = input.email.toLowerCase().trim();

    const user = User.create(
      email,
      passwordHash,
      input.personId,
      input.userTypeId,
      organizationId,
    );

    return this.userRepository.create(user);
  }
}
