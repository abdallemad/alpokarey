import { z } from "zod";

/**
 * The single source of truth for what the users console accepts.
 *
 * There is no create or delete schema: accounts are mirrored from Clerk on
 * sign-in and the console never makes one. The only write in the feature is a
 * role change, and it carries exactly one field.
 */

export const USER_ROLES = ["ADMIN", "STUDENT"] as const;

export const USER_SORT_OPTIONS = ["newest", "oldest", "name", "email"] as const;

/**
 * Query string for `GET /api/users`.
 *
 * `search` covers name **and** email: an admin looking for someone has one of
 * the two, and which one is not worth a second filter.
 */
export const userListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: z.enum([...USER_ROLES, "all"]).default("all"),
  sort: z.enum(USER_SORT_OPTIONS).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Body of `PATCH /api/users/:userId`.
 *
 * One field, and it is an enum — so the endpoint that decides who administers
 * the academy cannot be handed anything but one of two known values. **Who may
 * change it, and whether this particular change is allowed, are questions about
 * the database**, and they belong to `services/user.service.ts`.
 */
export const userRoleUpdateSchema = z.object({
  role: z.enum(USER_ROLES, "اختر صلاحية صحيحة"),
});

export type UserListQuery = z.output<typeof userListQuerySchema>;
export type UserSortOption = (typeof USER_SORT_OPTIONS)[number];
export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>;
