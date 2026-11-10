/**
 * Security helper option types and the logger.
 *
 * @module
 */

/** Structured logger interface — text or JSON output with named fields and child scoping. */
export interface Logger {
  debug(event: string, fields?: Record<string, unknown>): void;
  info(event: string, fields?: Record<string, unknown>): void;
  warn(event: string, fields?: Record<string, unknown>): void;
  error(event: string, fields?: Record<string, unknown>): void;
  /** Return a child logger with additional bound fields (e.g. requestId). */
  child(fields: Record<string, unknown>): Logger;
}

/** Result of a password-strength check — pass, or fail with a reason. */
export type PasswordCheckResult = { ok: true } | { ok: false; reason: string };

/** Options for the HTML sanitizer's tag/attribute allowlist. */
export interface SanitizeOptions {
  /** Allow these tags in addition to the defaults. */
  extraTags?: readonly string[];
  /** Disallow these tags even if they're in the defaults. */
  disallowTags?: readonly string[];
  /** Allow <img> tags. Default: true. */
  allowImages?: boolean;
  /** Allow <a> with href. Default: true. */
  allowLinks?: boolean;
  /**
   * Allow these attributes in addition to the per-tag defaults.
   * Keyed by tag name, `*` applies to all allowed tags. Entries ending in
   * `*` are prefix wildcards (`aria-*`, `data-*`). `on*` event handlers and
   * `is`/`xmlns` are always stripped regardless; `style` is stripped unless
   * listed here explicitly (literally, not via wildcard).
   */
  extraAttrs?: Record<string, readonly string[]>;
}

/** Options for the SSRF destination check. */
export interface SsrfCheckOptions {
  /** Caller opts in to allowing private/loopback destinations (e.g. for CI). */
  allowPrivateDestinations?: boolean;
}

/**
 * Extract a client IP from a Request for use as a rate-limit bucket key.
 *
 * By default forwarded headers are ignored (they are spoofable). The
 * fallback is the TCP peer address stamped by {@link rememberSocketAddr}
 * at the `Deno.serve` boundary, or `"unknown"` when that was never set
 * (unit tests, SSG). `"unknown"` still rate-limits — every unbound caller
 * shares one bucket.
 *
 * Operators behind a reverse proxy that overwrites X-Forwarded-For should
 * set `system.trusted_proxies: true` so {@link clientIp} prefers those
 * headers (the socket address is then the proxy, not the browser).
 */
export interface ClientIpOptions {
  /** Honor X-Forwarded-For / X-Real-IP. Only set when behind a trusted edge. */
  trustForwardedFor?: boolean;
}

export interface RateLimitStore {
  /**
   * Atomically check and increment the request counter for `key`.
   * Returns `allowed: true` when the counter is still within `maxRequests`
   * for the current `windowMs`, or `allowed: false` when the limit is reached.
   * `retryAfter` is the number of seconds until the window resets (0 when allowed).
   */
  check(
    key: string,
    maxRequests: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; retryAfter: number }>;

  /**
   * Record a single failure event for `key` (e.g. a bad login attempt).
   * Returns the total number of failures recorded within `windowMs`.
   */
  recordFailure(key: string, windowMs: number): Promise<number>;

  /**
   * Return true if the failure count for `key` within `windowMs` is at or
   * above `threshold`.
   */
  isLocked(key: string, threshold: number, windowMs: number): Promise<boolean>;

  /**
   * Clear all recorded failures for `key` (called on successful login).
   */
  clearFailures(key: string): Promise<void>;
}

/**
 * A fixed-window rate limiter keyed by an arbitrary string (usually a client
 * IP). `check` is synchronous and in-process; the async methods go through the
 * limiter's {@link RateLimitStore}, so they work across processes when a shared
 * store is configured.
 */
export interface RateLimiter {
  /** Count one request for `key`. False when the limit is exceeded. The key `"unknown"` is never limited. */
  check(key: string): boolean;
  /** Like `check`, but through the store; also reports when to retry. */
  checkAsync(key: string): Promise<{ allowed: boolean; retryAfter: number }>;
  /** Seconds until `key`'s window resets. */
  retryAfter(key: string): number;
  /** Record a failed attempt for `key` (for lockouts); returns the count in the window. */
  recordFailure(key: string, windowMs?: number): Promise<number>;
  /** True when `key` has `threshold` or more failures in the window. */
  isLocked(key: string, threshold: number, windowMs?: number): Promise<boolean>;
  /** Forget the failures recorded for `key`. */
  clearFailures(key: string): Promise<void>;
}
