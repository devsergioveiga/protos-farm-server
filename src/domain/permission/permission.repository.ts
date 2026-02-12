import type { PermissionAction, Resource } from "./permission.vo.js";

export interface Permission {
  userTypeId: string;
  organizationId: string;
  resource: Resource;
  action: PermissionAction;
}

export interface ListPermissionsInput {
  organizationId?: string;
  userTypeId?: string;
}

export interface ListPermissionsResult {
  items: Permission[];
}

export interface SavePermissionsInput {
  userTypeId: string;
  organizationId: string;
  permissions: { resource: Resource; action: PermissionAction }[];
}

export interface IPermissionRepository {
  list(input: ListPermissionsInput): Promise<ListPermissionsResult>;
  save(input: SavePermissionsInput): Promise<void>;
  hasPermission(
    userTypeId: string,
    organizationId: string | null,
    resource: Resource,
    action: PermissionAction,
  ): Promise<boolean>;
}
