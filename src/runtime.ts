/**
 * What a plugin gets to work with once the site is up: `MountApi.runtime`.
 *
 * A curated slice of the booted site, as narrow structural interfaces: only the
 * members plugins call are declared, and core's classes are proven assignable
 * to them. Everything is read-only. `jobs` is a getter because the job
 * scheduler is created per serving process, after `mount()`: read it lazily.
 *
 * Interfaces whose methods take objects core types more widely are declared
 * with method syntax, which makes the parameter check bivariant.
 *
 * @module
 */

import type { PluginAuthz } from "./authz.ts";
import type { BlueprintField, BlueprintMap } from "./blueprints.ts";
import type { DuneConfig, SiteConfig } from "./config.ts";
import type { ContentApi } from "./content-api.ts";
import type { Submission, SubmissionStatus } from "./forms.ts";
import type { HistoryEngine } from "./history.ts";
import type { HookRegistry } from "./hooks.ts";
import type {
  ContentFormat,
  PageFrontmatter,
  PageIndex,
} from "./page-index.ts";
import type { SearchEngine } from "./search.ts";
import type { StorageAdapter } from "./storage.ts";

/** A loaded page: the index entry plus lazily rendered content. */
export interface Page {
  sourcePath: string;
  route: string;
  language: string;
  format: ContentFormat;
  template: string;
  navTitle: string;
  frontmatter: PageFrontmatter;
  /** Raw body, or null for formats that have none. */
  rawContent: string | null;
  /** Render the page body to HTML. */
  html(): Promise<string>;
}

/** Maps URL paths to pages. */
export interface RouteResolver {
  findBySourcePath(sourcePath: string): PageIndex | undefined;
  getNavigation(lang?: string): PageIndex[];
  getTopNavigation(lang?: string): PageIndex[];
}

/** A template resolved by a theme. */
export interface LoadedTemplate {
  /** The template component (a Preact component; typed `unknown` here). */
  component: unknown;
}

/** Loads templates, layouts and locale strings from a theme. */
export interface ThemeLoader {
  resolveTemplateName(page: Page): string | null;
  loadTemplate(name: string): Promise<LoadedTemplate | null>;
  loadLayout(name: string): Promise<unknown | null>;
  loadLocale(lang: string): Promise<Record<string, string>>;
}

/** The content engine: pages, routes, themes, rebuilds. */
export interface PluginEngine {
  readonly config: DuneConfig;
  readonly site: SiteConfig;
  /** The content index. */
  readonly pages: PageIndex[];
  /** Taxonomy name → term → source paths. */
  readonly taxonomyMap: Record<string, Record<string, string[]>>;
  /** Loaded blueprint definitions, keyed by template name. */
  readonly blueprints: BlueprintMap;
  /** User-controlled theme settings from `data/theme-config.json`. */
  readonly themeConfig: Record<string, unknown>;
  readonly router: RouteResolver;
  /** The active theme's loader. */
  readonly themes: ThemeLoader;
  /** Load a full page from its source path. */
  loadPage(sourcePath: string): Promise<Page>;
  /** Rebuild the content index. */
  rebuild(): Promise<void>;
  /**
   * Switch the active theme: swaps the loader, reloads theme config, fires
   * `onThemeSwitch` and rebuilds. Does not persist the choice to disk.
   */
  switchTheme(name: string): Promise<void>;
  /** A loader for a theme other than the active one, for previews. */
  createPreviewTheme(name: string): Promise<ThemeLoader>;
}

/** Search across the content index, plus engine management. */
export interface PluginSearch extends SearchEngine {
  register(name: string, engine: SearchEngine): void;
  setActiveEngine(name: string): void;
  activeEngineName(): string;
  registeredEngineNames(): string[];
  setParallelMode(enabled: boolean): void;
  isParallelMode(): boolean;
}

/** A Flex Object schema. */
export interface FlexSchema {
  title: string;
  icon?: string;
  description?: string;
  fields: Record<string, BlueprintField>;
  version?: number;
}

/** A single Flex Object record. */
export interface FlexRecord {
  _id: string;
  _type: string;
  _createdAt: number;
  _updatedAt: number;
  [key: string]: unknown;
}

/** Flex Objects: schema-driven custom content types. */
export interface FlexEngine {
  loadSchemas(): Promise<Record<string, FlexSchema>>;
  list(type: string): Promise<FlexRecord[]>;
  get(type: string, id: string): Promise<FlexRecord | null>;
  create(
    type: string,
    schema: FlexSchema,
    data: Record<string, unknown>,
  ): Promise<FlexRecord>;
  update(
    type: string,
    id: string,
    schema: FlexSchema,
    data: Record<string, unknown>,
  ): Promise<FlexRecord | null>;
  delete(type: string, id: string): Promise<void>;
}

/** Public form submissions: core writes them, an admin manages them. */
export interface SubmissionManager {
  get(form: string, id: string): Promise<Submission | null>;
  list(form: string): Promise<Submission[]>;
  listForms(): Promise<string[]>;
  setStatus(
    form: string,
    id: string,
    status: SubmissionStatus,
  ): Promise<boolean>;
  delete(form: string, id: string): Promise<boolean>;
}

/** A field in a page-builder section. */
export interface SectionField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  default?: unknown;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  itemFields?: SectionField[];
}

/** A page-builder section type. */
export interface SectionDef {
  type: string;
  label: string;
  icon: string;
  description: string;
  fields: SectionField[];
}

/** The page-builder section registry the renderer uses. */
export interface SectionRegistry {
  all(): SectionDef[];
  get(type: string): SectionDef | undefined;
}

/** Latency statistics. */
export interface LatencyStats {
  p50: number;
  p95: number;
  p99: number;
  max: number;
  count: number;
}

/** A point-in-time view of in-process performance metrics. */
export interface MetricsSnapshot {
  ts: string;
  uptimeSeconds: number;
  requests: {
    total: number;
    errors: number;
    errorRate: number;
    latency: LatencyStats;
  };
  topRoutes: Array<
    { route: string; requests: number; errors: number; latency: LatencyStats }
  >;
  pageCache: {
    entries: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
  } | null;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  engine: {
    pageCount: number;
    rebuildCount: number;
    lastRebuildMs: number | null;
  };
  slowQueries: Array<{
    ts: string;
    type: "collection" | "search";
    query: string;
    durationMs: number;
  }>;
}

/** In-process performance metrics. */
export interface MetricsCollector {
  snapshot(): MetricsSnapshot;
}

/** State of one background job. */
export interface JobState {
  name: string;
  lastRun: number | null;
  nextRun: number | null;
  status: "idle" | "running" | "errored";
  lastError: string | null;
}

/** The background job scheduler of the serving process. */
export interface JobScheduler {
  run(name: string): Promise<void>;
  listStatus(): Promise<JobState[]>;
  getStatus(name: string): Promise<JobState | null>;
}

/** The booted site, as a plugin sees it. */
export interface PluginRuntime {
  readonly engine: PluginEngine;
  readonly config: DuneConfig;
  /** Site storage (the site root, not only the content directory). */
  readonly storage: StorageAdapter;
  readonly search: PluginSearch;
  /** The hook registry: fire the page events when you write a page. */
  readonly hooks: HookRegistry;
  /** Content query API. */
  readonly contentApi: ContentApi;
  readonly history: HistoryEngine;
  readonly flexEngine: FlexEngine;
  readonly metrics: MetricsCollector;
  readonly submissions: SubmissionManager;
  readonly sections: SectionRegistry;
  /** The authorisation system; absent when authz is not enabled. */
  readonly authz?: PluginAuthz;
  /**
   * The job scheduler of the serving process; `undefined` until `dune serve`
   * starts it, which happens after `mount()`. A getter: read `runtime.jobs`
   * when you need it. Destructuring it captures `undefined` for good.
   */
  readonly jobs?: JobScheduler;
}
