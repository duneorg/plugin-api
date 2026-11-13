/**
 * Hooks and the plugin object: lifecycle events, `DunePlugin`, the objects
 * `setup()` and `mount()` receive, and the registrations a plugin contributes.
 *
 * Callback-shaped members that core hands wider objects to (route handlers,
 * hook handlers) are declared with method syntax so a handler written against
 * these narrower types is accepted by core, and the other way round.
 *
 * @module
 */

import type { PluginApp, PluginRouteContext } from "./app.ts";
import type { AuthzRelation } from "./authz.ts";
import type { BlueprintField } from "./blueprints.ts";
import type { CapabilityReader, CapabilityRegistrar } from "./capabilities.ts";
import type { DuneConfig } from "./config.ts";
import type { ContentApi } from "./content-api.ts";
import type { Submission } from "./forms.ts";
import type { PluginRuntime } from "./runtime.ts";
import type { PluginServices } from "./services.ts";
import type { StorageAdapter } from "./storage.ts";

/**
 * All lifecycle events a plugin can subscribe to. New events may be added in
 * minor versions; existing events are not removed or renamed within a major.
 */
export type HookEvent =
  // Startup
  | "onConfigLoaded"
  | "onStorageReady"
  | "onContentIndexReady"
  // Request lifecycle
  | "onRequest"
  | "onCollectionResolved"
  | "onBeforeRender"
  // Content processing
  | "onMarkdownProcess"
  | "onMarkdownProcessed"
  | "onMediaDiscovered"
  // Cache
  | "onCacheHit"
  | "onCacheMiss"
  | "onCacheInvalidate"
  // API
  | "onApiRequest"
  | "onApiResponse"
  // Engine lifecycle
  | "onRebuild"
  | "onThemeSwitch"
  // Search
  | "onSearchRecordsCollect"
  | "onSearchEngineCreate"
  // Content mutation: fired by whoever writes the page, never by core on their
  // behalf. Payloads carry paths relative to the content directory.
  | "onPageCreate"
  | "onPageUpdate"
  | "onPageDelete"
  | "onPageMove"
  | "onWorkflowChange"
  // Public features (fired by core, so they work without an admin plugin)
  | "onFormSubmit"
  | "onSystemAction";

/**
 * Payload of `onPageMove`: pages were renamed, renumbered or reordered.
 *
 * The other page events carry `actor?: string` the same way: `onPageCreate`
 * `{ sourcePath, title, actor? }`, `onPageUpdate` and `onPageDelete`
 * `{ sourcePath, actor? }`. Whoever writes the page fires the event and fills
 * `actor` when a person is behind the write.
 */
export interface PageMovePayload {
  moves: Array<{ from: string; to: string }>;
  /** Who did it (the user's name or id), when a person did; absent for CLI and automated writes. */
  actor?: string;
}

/** Payload of `onFormSubmit`: a public form submission was accepted and stored. */
export interface FormSubmitPayload {
  /** Form name (the `forms/<name>.yaml` file). */
  form: string;
  /** The stored submission. */
  submission: Submission;
}

/** Payload of `onSystemAction`: an incoming webhook ran an action. */
export interface SystemActionPayload {
  action: "rebuild" | "purge-cache";
  /** Source IP (honours `system.trusted_proxies`), or null when unknown. */
  ip: string | null;
  userAgent: string | null;
}

/**
 * Hook handler signature. Declared with method syntax (a bivariant parameter)
 * so a handler written against these narrower types and the handlers core
 * already holds are accepted in both directions: core hands handlers a wider
 * context than this package declares.
 */
export type HookHandler<T = unknown> = {
  handler(context: HookContext<T>): Promise<void> | void;
}["handler"];

/** Context passed to each hook handler. */
export interface HookContext<T = unknown> {
  event: HookEvent;
  data: T;
  config: DuneConfig;
  storage: StorageAdapter;
  /** Stop further hook processing for this event. */
  stopPropagation: () => void;
  /** Replace the data being passed through the hook chain. */
  setData: (data: T) => void;
  /** Background job API, present only when the job scheduler is running. */
  jobs?: {
    /** Trigger a registered job by name immediately, regardless of its schedule. */
    run(name: string): Promise<void>;
  };
  /**
   * The content query API. Absent for the hooks that fire before a content
   * index exists (`onConfigLoaded`, `onStorageReady`, `onContentIndexReady`,
   * `onSearchRecordsCollect`, `onSearchEngineCreate`) and in the lightweight
   * registries some CLI commands build. Guard with `ctx.content?.`.
   */
  content?: ContentApi;
}

/** What a plugin's `setup()` receives. */
export interface PluginApi {
  /** Hook registry: call `hooks.on()` to subscribe to lifecycle events. */
  hooks: HookRegistry;
  /** Merged site configuration (read-only). */
  config: DuneConfig;
  /** Storage adapter for reading and writing plugin-specific data. */
  storage: StorageAdapter;
  /** Services built by core: security policy, sessions, users, passwords, rate limiting, logger. */
  services: PluginServices;
  /**
   * Declare what this plugin provides to core and to other plugins. Declaring
   * only records it; core resolves the slot factories after every `setup()`
   * has settled.
   */
  capabilities: CapabilityRegistrar;
}

/** A public-facing route contributed by a plugin. */
export interface PublicRouteRegistration {
  /** HTTP method (default `GET`); `ALL` matches any. */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "ALL";
  /** Full URL path (must start with `/`). */
  path: string;
  /** Route handler. */
  handler(ctx: PluginRouteContext): Response | Promise<Response>;
  /** Absolute path to an island module used by this route. */
  island?: string;
}

/**
 * Plugin definition. Export it as the default export of your plugin module.
 *
 * @example
 * ```ts
 * export default {
 *   name: "my-plugin",
 *   version: "1.0.0",
 *   hooks: {
 *     onRebuild: (ctx) => { console.log("rebuilt"); },
 *   },
 * } satisfies DunePlugin;
 * ```
 */
export interface DunePlugin {
  /** Unique plugin identifier, used as the key in `config.plugins`. */
  name: string;
  /** SemVer plugin version. */
  version: string;
  description?: string;
  author?: string;
  /**
   * The oldest `@dune/core` this plugin runs on, as a version (`"0.37.0"`).
   * Set it to {@link MIN_CORE_VERSION} so it follows the contract version the
   * plugin was built against; core skips the plugin with a message on an older
   * core instead of letting it fail at runtime.
   */
  requiresCore?: string;
  /** Lifecycle hook subscriptions, called in registration order. */
  hooks: Partial<Record<HookEvent, HookHandler>>;
  /** Blueprint-style config schema for the plugin's own settings. */
  configSchema?: Record<string, BlueprintField>;
  /** Called once when the plugin is registered. */
  setup?(api: PluginApi): Promise<void> | void;
  /** Absolute path to the plugin's static assets directory (set by the loader). */
  assetDir?: string;
  /**
   * Browser code entry points to bundle and serve at
   * `/plugins/{plugin-name}/{entry}.js`. Bump the plugin version whenever
   * client code changes: bundles are cached per name and version.
   */
  clientEntries?: Record<string, string>;
  /** Absolute path to the plugin's templates directory (set by the loader). */
  templateDir?: string;
  /** Names of other plugins this plugin depends on. */
  dependencies?: string[];
  /** Public-facing Fresh routes, registered before the content catch-all. */
  publicRoutes?: PublicRouteRegistration[];
  /** Preact island file specifiers contributed by this plugin. */
  islandSpecifiers?: string[];
  /** New admin-permission actions, each mapped to the relations that satisfy it. */
  authzActions?: Record<string, readonly AuthzRelation[]>;
  /** Mount routes onto the app, after bootstrap and before requests are served. */
  mount?(api: MountApi): Promise<void> | void;
  /**
   * Transform an HTTP response before it is sent. Output must depend only on
   * `ctx.auth` and `ctx.page`, because transformed responses are cached by
   * pathname for anonymous requests.
   */
  transformResponse?(
    ctx: ResponseTransformContext,
  ): Promise<Response> | Response;
}

/** Context passed to {@link DunePlugin.transformResponse}. */
export interface ResponseTransformContext {
  req: Request;
  /** The response produced by the app, possibly already transformed by earlier plugins. */
  response: Response;
  /** The signed-in admin, or null when the request carries no valid admin session. */
  auth: {
    username: string;
    role: string;
    /**
     * A synchronous, role-only approximation of the permission check. Fine for
     * UI affordances; never an access-control decision.
     */
    hasPermission(permission: string): boolean;
  } | null;
  config: DuneConfig;
  /** Content page matching the current URL, or null for non-content routes. */
  page: {
    sourcePath: string;
    route: string;
    title: string | null;
    template: string;
  } | null;
  /**
   * What plugins provide, as `MountApi.capabilities` offers it: slots such as
   * `get("admin.prefix")` and any extension point a plugin declares, such as
   * `list(BAR_ACTIONS)`. Read per request, so a plugin module shared between
   * sites keeps no state of its own.
   */
  capabilities: import("./capabilities.ts").CapabilityReader;
}

/** What a plugin's `mount()` receives. */
export interface MountApi {
  /** Where routes and middleware are registered. */
  app: PluginApp;
  /** The booted site. */
  runtime: PluginRuntime;
  /** The same services object `setup()` received. */
  services: PluginServices;
  /** What plugins provide. Read lazily (at request time): a provider may be absent. */
  capabilities: CapabilityReader;
}

/** Hook registry. */
export interface HookRegistry {
  /** Register a plugin. */
  registerPlugin(plugin: DunePlugin): void;
  /** Register a single hook handler. */
  on<T = unknown>(event: HookEvent, handler: HookHandler<T>): void;
  /** Remove a hook handler. */
  off(event: HookEvent, handler: HookHandler): void;
  /** Fire a hook event, passing data through all handlers. */
  fire<T = unknown>(event: HookEvent, data: T): Promise<T>;
  /** List registered plugins. */
  plugins(): DunePlugin[];
  /** Resolve once every plugin's `setup()`, including async ones, has settled. Never rejects. */
  whenSetupComplete(): Promise<void>;
}
