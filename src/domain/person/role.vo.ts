export type Role =
  | "USER"
  | "CLIENT"
  | "SUPPLIER"
  | "EMPLOYEE"
  | "MANUFACTURER"
  | "FARM_OWNER";

export const ROLES: Role[] = [
  "USER",
  "CLIENT",
  "SUPPLIER",
  "EMPLOYEE",
  "MANUFACTURER",
  "FARM_OWNER",
];

export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}
