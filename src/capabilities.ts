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
 * contributing plugin ({@link Contributions}).
 *
 * @module
 */

import type { AdminBarAction, AdminBarActionContext } from "./hooks.ts";
import type {
  AdminPageRegistration,
  AdminRouteRegistration,
  ContentEditorPlugin,
} from "./hooks.ts";
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

/** Slots: at most one active provider each. First-party keys only in 1.0. */
export interface Capabilities {
  /** Who is the admin on this request. */
  "auth.session": RequestAuthenticator;
  /** Executes due scheduled actions. */
  "scheduler.executor": ScheduledActionExecutor;
  /** Real-time inline editing. */
  "inline-edit": InlineEditManager;
  /** A replacement page editor. */
  "editor.content": ContentEditorPlugin;
}

/** Contribution points: one item from each contributing plugin. */
export interface Contributions {
  /** An extra admin page. */
  "admin.pages": AdminPageRegistration;
  /** A guarded admin route under the admin prefix. */
  "admin.routes": AdminRouteRegistration;
  /** Buttons for the admin bar. */
  "bar.actions": (ctx: AdminBarActionContext) => AdminBarAction[];
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
  contribute<K extends keyof Contributions>(
    point: K,
    item: Contributions[K],
  ): void;
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
  /** Everything contributed to a point, in plugin registration order. */
  list<K extends keyof Contributions>(point: K): readonly Contributions[K][];
  /** Who provides what, for `dune doctor`. */
  providers(): CapabilityProvider[];
}
