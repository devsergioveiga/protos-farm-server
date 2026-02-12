/**
 * IDs fixos dos tipos de usuário do sistema.
 * Usados no seed e como default ao criar usuários.
 */
export const SYSTEM_USER_TYPE_IDS = {
  SUPER_ADMIN: "11111111-1111-4111-8111-111111111111",
  ORG_ADMIN: "22222222-2222-4222-8222-222222222222",
  USER: "33333333-3333-4333-8333-333333333333",
} as const;
