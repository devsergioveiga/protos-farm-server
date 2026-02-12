export type Role = "USER" | "CLIENT" | "SUPPLIER" | "EMPLOYEE";

export const ROLES: Role[] = ["USER", "CLIENT", "SUPPLIER", "EMPLOYEE"];

export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}
