import bcrypt from "bcrypt";
import type { IUserRepository } from "../../domain/user/user.repository.js";
import type { User } from "../../domain/user/user.entity.js";
import {
  signAccessToken,
  signRefreshToken,
} from "../../infrastructure/auth/jwt.service.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    personId: string;
    userTypeId: string;
    organizationId: string | null;
  };
}

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(
      input.email.toLowerCase().trim()
    );
    if (!user) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const accessToken = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id, user.email);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        personId: user.personId,
        userTypeId: user.userTypeId,
        organizationId: user.organizationId,
      },
    };
  }
}
