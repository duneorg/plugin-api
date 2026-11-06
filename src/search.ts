/**
 * The search-engine plugin contract: `onSearchRecordsCollect`,
 * `onSearchEngineCreate` and the engine a plugin registers.
 *
 * @module
 */

import type { PageIndex } from "./page-index.ts";

/**
 * A search record contributed by a plugin via the `onSearchRecordsCollect`
 * hook. Indexed from memory (no file read) and surfaced as a synthetic
 * {@link PageIndex} at `route`.
 */
export interface InjectedSearchRecord {
  /** Result link and unique index key, e.g. `/pdf/issue-1.pdf`. */
  route: string;
  /** Display title. */
  title: string;
  /** Plain text body to full-text index. */
  body: string;
  /** Optional additional indexed fields (field name → text). */
  fields?: Record<string, string>;
  /** Template label for facets/filtering. Default: `"page"`. */
  template?: string;
}

/** A single result returned by {@link SearchEngine.search}. */
export interface SearchResult {
  /** The matched page */
  page: PageIndex;
  /** Relevance score (higher = better) */
  score: number;
  /** Matching excerpt/context around the hit */
  excerpt: string;
  /** Query terms that matched (for <mark> highlighting) */
  highlights?: string[];
  /** Facet field values extracted from this result's frontmatter */
  facetValues?: Record<string, string | string[]>;
}

/**
 * Narrows results to documents whose `field` resolves to exactly `value`.
 * `field` is either a {@link PageIndex} top-level property name (`template`,
 * `language`) or a facet field declared via `system.search.facets[].field`
 * in `site.yaml`, resolved from {@link PageIndex.extra}.
 */
export interface SearchFilter {
  field: string;
  value: string;
}

/** Options accepted by {@link SearchEngine.search}. */
export interface SearchOptions {
  /** Narrow results to a single field=value match. */
  filter?: SearchFilter;
  /** Result order. Default: `"relevance"`. */
  sort?: "relevance" | "date";
  /**
   * Skip this many matching results before collecting `limit` of them —
   * for paging through a result set. Default: `0`.
   */
  offset?: number;
}

/** Value → count map returned by {@link SearchEngine.facetCounts}. */
export type FacetCounts = Record<string, number>;

/** Full-text search engine over the Dune content index. Obtain via {@link createSearchEngine}. */
export interface SearchEngine {
  /** Build the search index (call after content index is ready) */
  build(): Promise<void>;
  /**
   * Search for pages matching a query.
   *
   * Async to allow external search backends (e.g. Meilisearch) to make
   * network calls. The built-in in-memory engine resolves immediately.
   */
  search(
    query: string,
    limit?: number,
    options?: SearchOptions,
  ): Promise<SearchResult[]>;
  /**
   * Count distinct values of `field` across all documents matching `query`
   * (ignoring `limit` and any filter) — used to render facet tabs with
   * counts. Optional: engines that don't implement faceting simply omit it,
   * and callers should treat a missing method as "no counts available".
   */
  facetCounts?(query: string, field: string): Promise<FacetCounts>;
  /** Rebuild index (after content changes) */
  rebuild(pages: PageIndex[]): Promise<void>;
  /**
   * Return autocomplete suggestions for a given prefix string.
   *
   * Async to allow external search backends to serve suggestions from
   * a network call. The built-in engine resolves immediately.
   *
   * @param prefix - The text the user has typed so far
   * @param limit  - Maximum number of suggestions (default: 10)
   */
  suggest(prefix: string, limit?: number): Promise<string[]>;
}

/**
 * Payload for the `onSearchRecordsCollect` hook.
 *
 * Plugins push entries onto `records` to add them to the search index
 * (e.g. extracted PDF text). Fired once during bootstrap before the search
 * engine is created.
 */
export interface SearchRecordsCollectContext {
  records: InjectedSearchRecord[];
}

/**
 * Payload for the `onSearchEngineCreate` hook.
 *
 * A plugin registers an engine with {@link SearchEngineCreateContext.register}
 * and may make it active. The context carries what an engine needs to index:
 * the pages, the plugin-injected records, and a loader for a page's plain-text
 * body. (Core's own context also carries storage, the content directory, the
 * configuration and the format registry; the first-party engines read none of
 * them, so they are not part of the contract.)
 */
export interface SearchEngineCreateContext {
  /**
   * Register a named engine with the search manager. Call
   * `register("meilisearch", engine)`; the built-in engine stays active unless
   * you also call `setActiveEngine`.
   */
  register: (name: string, engine: SearchEngine) => void;
  /**
   * Switch the active engine. Must have been registered via `register` first.
   */
  setActiveEngine: (name: string) => void;
  /** Content pages available to index. */
  pages: PageIndex[];
  /** Records collected from the `onSearchRecordsCollect` hook. */
  injectedRecords: InjectedSearchRecord[];
  /**
   * Load a page's plain-text body, so an engine can index the same text the
   * built-in engine does without reading files itself.
   */
  loadText: (page: PageIndex) => Promise<string>;
}
