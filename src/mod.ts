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
  InlineEditManager,
} from "./inline-edit.ts";
export type { ContentFormat, PageIndex } from "./page-index.ts";
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
export type { ScheduledAction } from "./workflow.ts";
export { type DuneErrorCode, isDuneError } from "./errors.ts";
