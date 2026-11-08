/**
 * Capabilities: what a plugin *provides* to core and to other plugins.
 *
 * `PluginServices` go the other way (core implements, a plugin uses). A
 * capability is implemented by a plugin and used by core or another plugin, and
 * is optional by nature: when nobody provides it the consumer carries on
 * without the feature.
 *
 * Two shapes: a **slot** has at most one active provider
 * ({@link Capabilities}); a **contribution point** collects one item from each
 * contributing plugin. A plugin that other plugins can extend declares its own
 * keys as typed tokens ({@link CapabilityKey}, made with {@link capabilityKey}),
 * not by module augmentation, which JSR does not accept in a published package.
 *
 * @module
 */

import type { DuneConfig } from "./config.ts";
import type { HistoryEngine } from "./history.ts";
import type { HookRegistry } from "./hooks.ts";
import type { InlineEditManager } from "./inline-edit.ts";
import type { PluginServices } from "./services.ts";
import type { StorageAdapter } from "./storage.ts";
import type { ScheduledAction } from "./workflow.ts";

/** The result of authenticating a request as an admin-tier session. */
export interface AuthenticateResult {
  authenticated: boolean;
  /**
   * The signed-in admin. Only `id` is guaranteed: `username` is absent for
   * OAuth/magic-link accounts, so fall back to `name`, then `email`, then `id`.
   */
  user?: {
    id: string;
    username?: string;
    email?: string;
    name?: string;
    roles?: string[];
  };
}

/** Tells core whether a request carries an authenticated admin session. */
export interface RequestAuthenticator {
  /**
   * Resolve the admin session of a request. Called on public pages, so answer
   * quickly, without touching a session store, when the request carries no
   * session of its own.
   */
  authenticate(req: Request): Promise<AuthenticateResult>;
  /**
   * Names of the cookies that carry this provider's session. Core uses them to
   * decide whether to call {@link authenticate} at all and whether to keep a
   * response out of the shared page cache. When omitted, any request with a
   * `Cookie` header is treated as possibly signed in.
   */
  readonly sessionCookies?: readonly string[];
}

/** Runs a due scheduled action (publish, unpublish, archive). */
export interface ScheduledActionExecutor {
  execute(action: ScheduledAction): Promise<void>;
}

/**
 * Where the admin is mounted. Core never assumes an admin exists or where it
 * is: it reads this slot to keep admin routes out of the page cache, the static
 * build and the plugin-route namespace. No provider means no admin.
 */
export interface AdminPrefix {
  /** URL path prefix the admin is mounted at: starts with `/`, no trailing slash (e.g. `/admin`). */
  readonly prefix: string;
}

/**
 * Slots the contract itself consumes: at most one active provider each. The
 * list is closed. An extension point that belongs to a plugin is a
 * {@link CapabilityKey} that plugin exports.
 */
export interface Capabilities {
  /** Where the admin is mounted. */
  "admin.prefix": AdminPrefix;
  /** Who is the admin on this request. */
  "editor.session": RequestAuthenticator;
  /** Executes due scheduled actions. */
  "scheduler.executor": ScheduledActionExecutor;
  /** Real-time inline editing and its HTTP routes. */
  "editor.inline": InlineEditManager;
}

/**
 * A typed name for a slot or contribution point that a plugin declares.
 * Create it once with {@link capabilityKey} and export it:
 *
 * ```ts
 * export const BAR_ACTIONS: CapabilityKey<(ctx: BarActionContext) => BarAction[]> =
 *   capabilityKey("bar.actions");
 * // contributor:  api.capabilities.contribute(BAR_ACTIONS, ({ page }) => [...])
 * // consumer:     capabilities.list(BAR_ACTIONS)
 * ```
 *
 * **Prefix the name with the plugin that consumes it** (`admin.*` is the
 * admin's, `bar.*` plugin-inline-edit's); unprefixed namespaces belong to the
 * contract. Two keys with the same name are the same capability at runtime, so
 * a plugin may recreate another plugin's key from its documented name instead of
 * importing it.
 */
export interface CapabilityKey<T> {
  readonly name: string;
  /** Phantom: carries `T` for the type checker only. Never set. */
  readonly __type?: T;
}

/** Make a {@link CapabilityKey}. */
export function capabilityKey<T>(name: string): CapabilityKey<T> {
  return { name };
}

/** What a slot factory receives: core infrastructure that exists once every `setup()` has settled. */
export interface CapabilityContext {
  storage: StorageAdapter;
  config: DuneConfig;
  history: HistoryEngine;
  /** The hook registry; a factory that writes content fires the matching `onPage*` event itself. */
  hooks: HookRegistry;
  services: PluginServices;
  /** Plugin runtime data directory. */
  dataDir: string;
  /** Content directory relative to the site root. */
  contentDir: string;
}

/** Slot factory: may be async. Returning `undefined` declines the slot. */
export type CapabilityFactory<T> = (
  ctx: CapabilityContext,
) => T | undefined | Promise<T | undefined>;

/** `PluginApi.capabilities`: how a plugin declares what it provides. */
export interface CapabilityRegistrar {
  provide<K extends keyof Capabilities>(
    name: K,
    factory: CapabilityFactory<Capabilities[K]>,
  ): void;
  provide<T>(key: CapabilityKey<T>, factory: CapabilityFactory<T>): void;
  contribute<T>(key: CapabilityKey<T>, item: T): void;
}

/** One entry of {@link CapabilityReader.providers}. */
export interface CapabilityProvider {
  name: string;
  kind: "slot" | "contribution";
  /** Name of the plugin that registered it. */
  provider: string;
  /** Slots only: `unresolved`, `active`, `declined` (factory returned undefined) or `failed` (factory threw). */
  status: "unresolved" | "active" | "declined" | "failed";
}

/** `MountApi.capabilities`: how core and plugins consume capabilities. */
export interface CapabilityReader {
  /** The active provider of a slot, or undefined. */
  get<K extends keyof Capabilities>(name: K): Capabilities[K] | undefined;
  get<T>(key: CapabilityKey<T>): T | undefined;
  /** Everything contributed to a point, in plugin registration order. */
  list<T>(key: CapabilityKey<T>): readonly T[];
  /** Who provides what, for `dune doctor`. */
  providers(): CapabilityProvider[];
}
