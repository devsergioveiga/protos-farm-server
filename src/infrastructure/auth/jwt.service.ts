import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fallback para desenvolvimento local
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    return "dev-secret-change-in-production-min-32-chars";
  }
  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  return secret;
}

export interface TokenPayload {
  sub: string;
  email: string;
  type: "access" | "refresh";
}

export function signAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email, type: "access" } satisfies TokenPayload,
    getSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function signRefreshToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email, type: "refresh" } satisfies TokenPayload,
    getSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, getSecret()) as TokenPayload;
  return payload;
}
