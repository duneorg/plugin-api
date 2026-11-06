/**
 * Authorisation: the relations a plugin may grant through `authzActions`, and
 * the narrow surface of the site's authz system.
 *
 * Declared structurally so the package depends on no authorisation library. All
 * methods are declared with method syntax so core's stricter generic
 * implementation is assignable.
 *
 * @module
 */

/** The relation vocabulary every action is expressed in. */
export type AuthzRelation = "member" | "admin" | "editor" | "author" | "owner";

/** A subject or object in an authorisation tuple. */
export interface AuthzObject {
  type: string;
  id: string;
}

/** The site's authorisation system. Absent when authz is not enabled. */
export interface PluginAuthz {
  /** Whether `who` may perform the action `canThey` on `onWhat`. */
  check(
    args: { who: AuthzObject; canThey: string; onWhat: AuthzObject },
  ): Promise<boolean>;
  /** Grant a relation. */
  allow(
    args: { who: AuthzObject; toBe: AuthzRelation; onWhat: AuthzObject },
  ): Promise<unknown>;
  /** Revoke every tuple matching the given parts. */
  disallowAllMatching(
    args: { who?: AuthzObject; was?: AuthzRelation; onWhat?: AuthzObject },
  ): Promise<unknown>;
}
