/**
 * Services core hands to plugins (`PluginApi.services`, `MountApi.services`,
 * `CapabilityContext.services`): the infrastructure a plugin should not
 * reimplement or import from core internals.
 *
 * @module
 */

import type { PageFrontmatter } from "./page-index.ts";
import type { Scheduler, StagingEngine, WorkflowEngine } from "./engines.ts";
import type { SessionManager, UserStore } from "./identity.ts";
import type {
  ClientIpOptions,
  Logger,
  PasswordCheckResult,
  RateLimiter,
  RateLimitStore,
  SanitizeOptions,
  SsrfCheckOptions,
} from "./security.ts";
import type {
  BlueprintValidationError,
  ResolvedBlueprint,
} from "./blueprints.ts";

/** Stateless security policy. */
export interface SecurityService {
  /** Strip everything but a safe subset of HTML. */
  sanitizeHtml(input: string, opts?: SanitizeOptions): string;
  /** `fetch` that refuses private, loopback and otherwise unsafe destinations (SSRF guard). */
  safeFetch(
    url: string,
    init?: RequestInit,
    opts?: SsrfCheckOptions,
  ): Promise<Response>;
  /** A 413 response if the declared Content-Length exceeds `maxBytes`, else null. */
  checkBodySize(req: Request, maxBytes: number): Response | null;
  /** Wrap a body stream so reading past `maxBytes` fails with a `body_too_large` error. */
  limitedBody(
    stream: ReadableStream<Uint8Array> | null,
    maxBytes: number,
  ): ReadableStream<Uint8Array>;
  /** Password strength policy. */
  checkPasswordStrength(password: unknown): PasswordCheckResult;
  /** The client's IP, honouring forwarded headers only when `trustForwardedFor` is set. */
  clientIp(req: Request, opts?: ClientIpOptions): string;
  /** Parse YAML written by users with the safe-schema policy. */
  parseUserYaml(text: string): unknown;
}

/** Rate limiting primitives. */
export interface RateLimitService {
  /** A limiter allowing `maxRequests` per `windowMs`, optionally backed by a shared store. */
  createLimiter(
    maxRequests: number,
    windowMs: number,
    store?: RateLimitStore,
  ): RateLimiter;
  /** An in-process store (the default for a single process). */
  createLocalStore(): RateLimitStore;
}

/** Sessions over the backend configured in `system.session_store`. */
export interface SessionService {
  /**
   * A session manager whose store is chosen by core from `system.session_store`
   * (local files under `sessionsDir`, Deno KV or Redis) and scoped to this site
   * (`session_store.prefix`, `dune:<site id>` in multisite).
   */
  createManager(
    opts: { sessionsDir: string; lifetimeMs: number },
  ): Promise<SessionManager>;
}

/** User accounts. */
export interface UserService {
  /** The flat-file user store under `usersDir` in the site's storage. */
  createLocalStore(opts: { usersDir: string }): UserStore;
}

/** Password hashing (PBKDF2, format `pbkdf2:<iterations>:<salt>:<key>`). */
export interface PasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, stored: string): Promise<boolean>;
  /** True if the stored hash is below the current cost and should be re-hashed on next login. */
  needsRehash(stored: string): boolean;
  /** A valid hash of nothing, to verify against for unknown users (equal-cost login). */
  readonly dummyHash: string;
}

/** Access tuples on the site (`app:site`); the authz system itself is created by core. */
export interface AuthzService {
  /**
   * Make sure every given user holds the relation for their admin-tier role on
   * the site (`app:site`, the object `pages.update` and the other site-wide
   * actions are checked on). Idempotent. A no-op when the site has no authz
   * system (core creates one when a plugin provides `auth.session` or declares
   * `authzActions`, or the site has a login).
   */
  seedAdminTuples(users: Array<{ id: string; role: string }>): Promise<void>;
}

/**
 * Long-lived engines core constructs once per site. The plugin uses them; it
 * does not build them, so state and on-disk layout stay under core's control.
 * They live under `admin.runtime_dir` (default `.dune/admin`).
 */
export interface EngineServices {
  /** Content status transitions, from `site.workflow`. */
  workflow: WorkflowEngine;
  /** Scheduled publish/unpublish store. CRUD only; the process that serves requests starts the polling loop. */
  scheduler: Scheduler;
  /** Staged drafts of published pages. */
  staging: StagingEngine;
}

/** The site's frontmatter schemas (blueprints), as currently loaded. */
export interface BlueprintService {
  /** True if the template has a blueprint. */
  has(template: string): boolean;
  /** The template's blueprint with its `extends` chain flattened, or null if it has none. */
  resolve(template: string): ResolvedBlueprint | null;
  /** Validate frontmatter against the template's blueprint. Empty means valid, or no blueprint. */
  validate(
    frontmatter: PageFrontmatter,
    template: string,
  ): BlueprintValidationError[];
}

/** Search-related services. */
export interface SearchServices {
  analytics: {
    /** True when `system.search.analytics` is on and queries are being recorded. */
    readonly enabled: boolean;
    /** Aggregate the recorded queries; an empty summary when analytics is off or nothing is recorded yet. */
    summarize(limit?: number): Promise<SearchAnalyticsSummary>;
  };
}

/** Where a site keeps its data. Site-relative, as storage paths. */
export interface PathServices {
  /** The persistent data directory: `system.data_dir`, default `data`. */
  readonly dataDir: string;
  /** Plugin runtime state: `admin.runtime_dir`, default `.dune/admin`. */
  readonly runtimeDir: string;
}

/** Everything core hands a plugin. */
export interface PluginServices {
  security: SecurityService;
  rateLimit: RateLimitService;
  sessions: SessionService;
  users: UserService;
  passwords: PasswordService;
  logger: Logger;
  engines: EngineServices;
  authz: AuthzService;
  blueprints: BlueprintService;
  search: SearchServices;
  paths: PathServices;
}

/** Aggregated summary of recorded search events */
export interface SearchAnalyticsSummary {
  /** Total number of search events recorded since `since` */
  totalSearches: number;
  /** Unix epoch milliseconds of the first recorded search; null when none */
  since: number | null;
  /**
   * Most-searched queries, sorted by count descending.
   * Each entry also carries the average result count for that query.
   */
  topQueries: Array<{
    query: string;
    count: number;
    avgResults: number;
  }>;
  /**
   * Queries that returned zero results, sorted by count descending.
   * Useful for discovering missing content.
   */
  zeroResultQueries: Array<{
    query: string;
    count: number;
  }>;
}
