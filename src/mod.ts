/**
 * @dune/plugin-api: the contract between Dune and its plugins.
 *
 * A leaf package: it depends on neither `@dune/core` nor `@dune/theme-api`.
 * Core imports it and type-tests that what it hands a plugin is assignable to
 * these declarations, and that what a plugin hands in is accepted by core.
 *
 * @module
 */

export type { PluginApp, PluginRouteContext } from "./app.ts";
export type {
  Submission,
  SubmissionFile,
  SubmissionMeta,
  SubmissionStatus,
} from "./forms.ts";
export type {
  BlueprintField,
  BlueprintFieldType,
  BlueprintFieldValidation,
  BlueprintFileUploadConfig,
} from "./blueprints.ts";
export type {
  ContentApi,
  ContentSearchResult,
  PagesOptions,
  ResolvedPage,
  TaxonomyTerm,
} from "./content-api.ts";
export type {
  ActiveEditor,
  DocumentPresence,
  EditorIdentity,
  InlineEditManager,
  InlineEditRequestContext,
} from "./inline-edit.ts";
export type {
  ContentFormat,
  PageFrontmatter,
  PageIndex,
} from "./page-index.ts";
export type {
  FacetCounts,
  InjectedSearchRecord,
  SearchEngine,
  SearchEngineCreateContext,
  SearchFilter,
  SearchOptions,
  SearchRecordsCollectContext,
  SearchResult,
} from "./search.ts";
export type {
  StorageAdapter,
  StorageEntry,
  StorageStat,
  WatchEvent,
} from "./storage.ts";
export type {
  ContentStatus,
  ScheduledAction,
  WorkflowStage,
  WorkflowTransition,
} from "./workflow.ts";
export { capabilityKey } from "./capabilities.ts";
export {
  type DuneErrorCode,
  isDuneError,
  SearchConfigError,
} from "./errors.ts";
export {
  buildPageTitle,
  type ContentFileInfo,
  dirPathToRoute,
  getMimeType,
  isMediaFile,
  isRtl,
  parseContentFilename,
} from "./content-helpers.ts";
export { ADMIN_ROLE_RANK, highestAdminRole, type Role } from "./roles.ts";

/**
 * The contract's major.minor version. Bumped with every minor release of this
 * package (a test keeps it in step with `deno.json`).
 */
export const PLUGIN_API_VERSION = "1.3";

/**
 * The oldest `@dune/core` that implements everything in this version of the
 * contract. A plugin sets `DunePlugin.requiresCore` to it; core refuses the
 * plugin on anything older. It is raised in any release that adds something
 * core must provide (a required member, a new service), and left alone for a
 * release that only adds types, helpers or optional fields.
 */
export const MIN_CORE_VERSION = "0.37.0";
export type {
  ContentDiff,
  ContentRevision,
  HistoryEngine,
  RecordInput,
} from "./history.ts";
export type {
  Scheduler,
  StagedDraft,
  StagingEngine,
  UpsertInput,
  WorkflowEngine,
} from "./engines.ts";
export type {
  Session,
  SessionManager,
  User,
  UserCreate,
  UserStore,
} from "./identity.ts";
export type {
  ClientIpOptions,
  Logger,
  PasswordCheckResult,
  RateLimiter,
  RateLimitStore,
  SanitizeOptions,
  SsrfCheckOptions,
} from "./security.ts";
export type {
  BlueprintDefinition,
  BlueprintMap,
  BlueprintValidationError,
  ResolvedBlueprint,
} from "./blueprints.ts";
export type {
  AuthzService,
  BlueprintService,
  EngineServices,
  PasswordService,
  PathServices,
  PluginServices,
  RateLimitService,
  SearchAnalyticsSummary,
  SearchServices,
  SecurityService,
  SessionService,
  UserService,
} from "./services.ts";
export type { AuthzObject, AuthzRelation, PluginAuthz } from "./authz.ts";
export type {
  DuneConfig,
  LanguageConfig,
  SiteConfig,
  SystemConfig,
  ThemeConfig,
} from "./config.ts";
export type {
  AdminPrefix,
  AuthenticateResult,
  Capabilities,
  CapabilityContext,
  CapabilityFactory,
  CapabilityKey,
  CapabilityProvider,
  CapabilityReader,
  CapabilityRegistrar,
  RequestAuthenticator,
  ScheduledActionExecutor,
} from "./capabilities.ts";
export type {
  DunePlugin,
  FormSubmitPayload,
  HookContext,
  HookEvent,
  HookHandler,
  HookRegistry,
  MountApi,
  PageMovePayload,
  PluginApi,
  PublicRouteRegistration,
  ResponseTransformContext,
  SystemActionPayload,
} from "./hooks.ts";
export type {
  FlexEngine,
  FlexRecord,
  FlexSchema,
  JobScheduler,
  JobState,
  LatencyStats,
  LoadedTemplate,
  MediaFile,
  MetricsCollector,
  MetricsSnapshot,
  Page,
  PluginEngine,
  PluginRuntime,
  PluginSearch,
  RouteResolver,
  SectionDef,
  SectionField,
  SectionRegistry,
  SubmissionManager,
  ThemeLoader,
  ThemeManifest,
} from "./runtime.ts";
