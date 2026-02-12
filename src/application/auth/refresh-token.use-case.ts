import type { IUserRepository } from "../../domain/user/user.repository.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../../infrastructure/auth/jwt.service.js";

export interface RefreshInput {
  refreshToken: string;
}

export interface RefreshOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RefreshInput): Promise<RefreshOutput> {
    const payload = verifyToken(input.refreshToken);
    if (payload.type !== "refresh") {
      throw new Error("Token inválido.");
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    const accessToken = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id, user.email);

    return {
      accessToken,
      refreshToken,
    };
  }
}
