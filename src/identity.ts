/**
 * Identity: users, sessions and password helpers, the pieces an `auth.session` provider builds local login from.
 *
 * @module
 */

/** A Dune account — admin panel user, public site visitor, or both. */
export interface User {
  id: string;
  email: string;
  name?: string;
  /**
   * Login name for password-based (local admin) auth. Absent for
   * OAuth/magic-link-only accounts, which have no username concept.
   */
  username?: string;
  /** PBKDF2 hash, present only for accounts with a local password. */
  passwordHash?: string;
  /**
   * External identity provider this account was originally created with:
   * "local" (password) | "github" | "google" | "discord" | "magic" | ...
   * This is the account's original signup method.
   */
  provider: string;
  /** Roles/tags, e.g. ["admin"], ["member", "subscriber"]. */
  roles: string[];
  createdAt: number; // ms timestamp
  updatedAt: number;
  enabled: boolean;
}

/**
 * Input for creating a new {@link User} — server-generated fields are omitted.
 */
export type UserCreate =
  & Omit<User, "id" | "createdAt" | "updatedAt" | "enabled">
  & {
    enabled?: boolean;
  };

/** Storage-agnostic interface for reading and writing site user accounts. */
export interface UserStore {
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  getByUsername(username: string): Promise<User | null>;
  /** @throws {DuplicateEmailError} if a user with this email already exists. */
  create(user: UserCreate): Promise<User>;
  /** @throws {DuplicateEmailError} if `updates.email` is set and already used by a different user. */
  update(
    id: string,
    updates: Partial<
      Pick<
        User,
        | "email"
        | "name"
        | "username"
        | "passwordHash"
        | "roles"
        | "enabled"
      >
    >,
  ): Promise<User | null>;
  list(opts?: { limit?: number; offset?: number }): Promise<User[]>;
  delete(id: string): Promise<boolean>;
}

/** A single stored session record. */
export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  /** IP address of the client that created the session */
  ip?: string;
  /**
   * Full user object embedded in the session. Set when the caller has no
   * persistent user record to look up from — public auth's
   * `user_store: "session"` mode synthesises a User from OAuth/magic-link
   * claims at login and carries it in the session for the cookie's
   * lifetime. Admin sessions never set this.
   */
  embeddedUser?: User;
}

/**
 * Creates and validates sessions backed by a SessionStore.
 *
 * Shared by @dune/plugin-admin's admin sessions and public-site auth
 * sessions (dec-identity-unification Phase 5c) — one mechanism,
 * parameterized by which SessionStore backend it's given, rather than two
 * independently-implemented stacks. `create()`'s `embeddedUser` param is
 * only ever used by public auth's `user_store: "session"` mode; admin
 * sessions never pass it.
 */
export interface SessionManager {
  /** Create a new session for a user. */
  create(userId: string, ip?: string, embeddedUser?: User): Promise<Session>;
  /** Get and validate a session by its ID. Returns null if expired or not found. */
  get(sessionId: string): Promise<Session | null>;
  /** Revoke (delete) a session. */
  revoke(sessionId: string): Promise<void>;
  /** Revoke all sessions for a user. */
  revokeAll(userId: string): Promise<void>;
  /** Clean up expired sessions. */
  cleanup(): Promise<number>;
}
