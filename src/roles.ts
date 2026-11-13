/**
 * The admin-tier role ladder.
 *
 * @module
 */

/** The admin-tier roles. Other entries in `User.roles` are content-gating tags. */
export type Role = "admin" | "editor" | "author";

/** Admin-tier ranking: `admin` > `editor` > `author`. */
export const ADMIN_ROLE_RANK: Record<Role, number> = {
  admin: 3,
  editor: 2,
  author: 1,
};

/**
 * The highest-ranked admin-tier role in a `roles` array, or `""` when there is
 * none. Roles that are not admin-tier (content-gating tags such as `member`)
 * never win.
 */
export function highestAdminRole(roles: string[] | undefined): string {
  let best = "";
  for (const r of roles ?? []) {
    const rr = ADMIN_ROLE_RANK[r as Role] ?? 0;
    if (rr === 0) continue;
    if (!best || rr > (ADMIN_ROLE_RANK[best as Role] ?? 0)) best = r;
  }
  return best;
}
