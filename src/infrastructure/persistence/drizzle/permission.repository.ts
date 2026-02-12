import { and, eq } from "drizzle-orm";
import type {
  IPermissionRepository,
  ListPermissionsInput,
  ListPermissionsResult,
  Permission,
  SavePermissionsInput,
} from "../../../domain/permission/permission.repository.js";
import type { PermissionAction, Resource } from "../../../domain/permission/permission.vo.js";
import { db } from "./client.js";
import { permissions } from "./schema.js";

export class DrizzlePermissionRepository implements IPermissionRepository {
  async list(input: ListPermissionsInput): Promise<ListPermissionsResult> {
    const conditions = [];
    if (input.organizationId) {
      conditions.push(eq(permissions.organizationId, input.organizationId));
    }
    if (input.userTypeId) {
      conditions.push(eq(permissions.userTypeId, input.userTypeId));
    }

    const rows = await db
      .select()
      .from(permissions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const items: Permission[] = rows.map((r) => ({
      userTypeId: r.userTypeId,
      organizationId: r.organizationId,
      resource: r.resource as Resource,
      action: r.action as PermissionAction,
    }));

    return { items };
  }

  async save(input: SavePermissionsInput): Promise<void> {
    await db
      .delete(permissions)
      .where(
        and(
          eq(permissions.userTypeId, input.userTypeId),
          eq(permissions.organizationId, input.organizationId),
        ),
      );

    if (input.permissions.length === 0) return;

    await db.insert(permissions).values(
      input.permissions.map((p) => ({
        userTypeId: input.userTypeId,
        organizationId: input.organizationId,
        resource: p.resource,
        action: p.action,
      })),
    );
  }

  async hasPermission(
    userTypeId: string,
    organizationId: string | null,
    resource: Resource,
    action: PermissionAction,
  ): Promise<boolean> {
    if (!organizationId) return false;

    const [row] = await db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.userTypeId, userTypeId),
          eq(permissions.organizationId, organizationId),
          eq(permissions.resource, resource),
          eq(permissions.action, action),
        ),
      );

    return !!row;
  }
}
