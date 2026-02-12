import bcrypt from "bcrypt";
import { User } from "../../domain/user/user.entity.js";
import type { IPersonRepository } from "../../domain/person/person.repository.js";
import type { IUserRepository } from "../../domain/user/user.repository.js";
import type { IUserTypeRepository } from "../../domain/user-type/user-type.repository.js";

const SALT_ROUNDS = 10;

export interface CreateUserInput {
  email: string;
  password: string;
  personId: string;
  userTypeId: string;
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly personRepository: IPersonRepository,
    private readonly userTypeRepository: IUserTypeRepository,
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

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const email = input.email.toLowerCase().trim();

    const user = User.create(
      email,
      passwordHash,
      input.personId,
      input.userTypeId,
    );

    return this.userRepository.create(user);
  }
}
