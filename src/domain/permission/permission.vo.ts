export type PermissionAction = "create" | "read" | "update" | "delete";

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "create",
  "read",
  "update",
  "delete",
];

export const RESOURCES = [
  "users",
  "organizations",
  "user_types",
  "persons",
  "addresses",
  "contacts",
  "bank_data",
  "client_categories",
  "supplier_categories",
] as const;

export type Resource = (typeof RESOURCES)[number];

export function isPermissionAction(value: string): value is PermissionAction {
  return (PERMISSION_ACTIONS as readonly string[]).includes(value);
}

export function isResource(value: string): value is Resource {
  return RESOURCES.includes(value as Resource);
}
