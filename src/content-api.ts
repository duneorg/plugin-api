/**
 * The content query API (`runtime.contentApi`, `ctx.content` in hooks).
 *
 * @module
 */

import type { PageIndex } from "./page-index.ts";

/**
 * A fully resolved page — HTML rendered, frontmatter loaded, ready for use in
 * a Fresh route handler or API endpoint.
 *
 * @typeParam FM - Frontmatter shape. Defaults to `Record<string, unknown>`.
 *   Pass your own interface for type-safe field access:
 *   `contentApi.page<BlogPost>("/blog/hello")`
 */
export interface ResolvedPage<FM = Record<string, unknown>> {
  /** URL route — e.g. "/blog/hello-world" */
  route: string;
  /** Page title from frontmatter */
  title: string;
  /** ISO date string, or null if not set */
  date: string | null;
  /** Rendered HTML (from Markdown/MDX/TSX component) */
  html: string;
  /** Parsed frontmatter — typed as FM (defaults to Record<string, unknown>) */
  frontmatter: FM;
  /** BCP-47 language code (e.g. "en", "de") */
  language: string;
  /** Whether the page is published */
  published: boolean;
  /** Nav display title (falls back to `title`) */
  navTitle: string;
  /** Absolute URL built from site URL + route, or null if site URL is not set */
  url: string | null;
}

/** A single search result. */
export interface ContentSearchResult {
  route: string;
  title: string;
  score: number;
  excerpt?: string;
}

/**
 * A resolved taxonomy term with its associated page count.
 *
 * If any published page declares `termPageFor` pointing at this term,
 * `pageRoute` is set to that page's route. Otherwise null.
 *
 * Use `contentApi.termPage(vocab, value)` to resolve the full page with
 * rendered HTML and typed frontmatter.
 */
export interface TaxonomyTerm {
  name: string;
  slug: string;
  count: number;
  /** Route of the term page (from `termPageFor` frontmatter), or null. */
  pageRoute: string | null;
}

/** Filtering and sorting options for `ContentApi.pages()`. */
export interface PagesOptions {
  /** Filter by collection name. */
  collection?: string;
  /** Filter pages that have a specific taxonomy tag value. */
  tag?: string;
  /** Filter by taxonomy name and value. e.g. { name: "category", value: "news" } */
  taxonomy?: { name: string; value: string };
  /** Maximum number of pages to return. */
  limit?: number;
  /** Number of pages to skip before returning results. */
  offset?: number;
  /** Only return published pages. Defaults to true. */
  published?: boolean;
  /** Filter by language code. */
  language?: string;
  /** Sort order. Defaults to "order". */
  orderBy?: "date" | "title" | "order";
  /** Sort direction. Defaults to "asc". */
  orderDir?: "asc" | "desc";
}

/**
 * The Dune content query API.
 * Obtain an instance via `BootstrapResult.contentApi` (see the module doc above).
 */
export interface ContentApi {
  /**
   * Resolve a single page by URL route.
   *
   * Returns `null` if no page exists at the given route.
   * The HTML is rendered lazily (first access triggers Markdown/MDX/TSX processing).
   *
   * @param route - Absolute URL path, e.g. "/blog/hello-world"
   */
  page<FM = Record<string, unknown>>(
    route: string,
  ): Promise<ResolvedPage<FM> | null>;

  /**
   * Query the content index for pages matching the given criteria.
   *
   * Returns `PageIndex[]` (lightweight references — HTML is NOT pre-rendered).
   * Use `page()` to resolve individual pages when you need rendered HTML.
   */
  pages(opts?: PagesOptions): PageIndex[];

  /**
   * Full-text search across all indexed content.
   *
   * Returns synchronously (the search index is in-memory). Requires
   * `buildSearch: true` in the `bootstrap()` call, or `search.build()`
   * to have been called separately — otherwise the index is empty and
   * all queries return no results.
   *
   * @param query - Search query string
   * @param opts.limit - Maximum results to return (default: 10)
   */
  search(
    query: string,
    opts?: { limit?: number },
  ): Promise<ContentSearchResult[]>;

  /**
   * List all terms for a taxonomy.
   *
   * Each term includes a `pageRoute` pointing to its associated term page
   * if one exists (i.e. a page that declares `termPageFor` for this term).
   *
   * @param name - Taxonomy name as configured in `dune.yaml` (e.g. "tag", "category")
   */
  taxonomy(name: string): TaxonomyTerm[];

  /**
   * Resolve the term page for a taxonomy term.
   *
   * A term page is any published content page that declares `termPageFor`
   * in its frontmatter pointing at the given vocabulary and value:
   *
   * ```yaml
   * # Simple form — implies the "tag" vocabulary:
   * termPageFor: ewr
   *
   * # Explicit vocabulary:
   * termPageFor:
   *   category: politics
   * ```
   *
   * Returns `null` if no such page exists.
   *
   * @param vocab - Taxonomy vocabulary name, e.g. "tag", "category"
   * @param value - Term value, e.g. "ewr"
   */
  termPage<FM = Record<string, unknown>>(
    vocab: string,
    value: string,
  ): Promise<ResolvedPage<FM> | null>;
}

// ── Factory ───────────────────────────────────────────────────────────────────
