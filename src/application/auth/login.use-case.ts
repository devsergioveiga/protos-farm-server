import bcrypt from "bcrypt";
import type { IUserRepository } from "../../domain/user/user.repository.js";
import { SYSTEM_USER_TYPE_IDS } from "../../domain/user-type/system-user-types.js";
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
    const result = await this.userRepository.findByEmailWithOrganization(
      input.email.toLowerCase().trim(),
    );
    if (!result) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const isValid = await bcrypt.compare(
      input.password,
      result.user.passwordHash,
    );
    if (!isValid) {
      throw new Error("E-mail ou senha inválidos.");
    }

    const accessToken = signAccessToken(result.user.id, result.user.email);
    const refreshToken = signRefreshToken(result.user.id, result.user.email);

    const organizationId =
      result.user.userTypeId === SYSTEM_USER_TYPE_IDS.SUPER_ADMIN
        ? null
        : result.organizationId;

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        personId: result.user.personId,
        userTypeId: result.user.userTypeId,
        organizationId,
      },
    };
  }
}
