/**
 * Lightweight page reference used by the content API and search engines.
 *
 * Wider than the theme contract's `PageIndex` on purpose: a search engine
 * returns the entries core handed it inside its results, and core reads
 * `mtime` and `hash` off them. Treat `hash` as opaque (pass entries through
 * unchanged; do not build them by hand). Fields no plugin reads (role gating,
 * publish windows, redirect and term-page markers, cover image) are not
 * declared; core's entries carry them anyway.
 *
 * @module
 */

export type ContentFormat = "md" | "tsx" | "mdx";

export interface PageIndex {
  sourcePath: string;
  route: string;
  /** Language code. */
  language: string;
  format: ContentFormat;
  template: string;
  title: string;
  /** Navigation label; falls back to the title when `nav_title` is not set. */
  navTitle: string;
  date: string | null;
  /** `YYYY-MM-DD` from the `dateModified` frontmatter field, when present and valid. */
  dateModified?: string;
  /** Whether the page is live right now (`published` and inside its publish window). */
  published: boolean;
  /** Content workflow status. */
  status: "draft" | "in_review" | "published" | "archived";
  visible: boolean;
  routable: boolean;
  isModule: boolean;
  order: number;
  depth: number;
  parentPath: string | null;
  taxonomy: Record<string, string[]>;
  /** File modification time, for cache invalidation. Opaque: pass through. */
  mtime: number;
  /** Hash of the frontmatter, for change detection. Opaque: pass through. */
  hash: string;
  /** Site-declared custom frontmatter fields extracted for facet filtering. */
  extra?: Record<string, string | string[]>;
}

/**
 * Frontmatter of a page. Only the fields the plugin contract itself relies on
 * are named; any other field is allowed (`[key: string]: unknown`). The full
 * catalogue of standard fields is in `@dune/theme-api`'s `PageFrontmatter`.
 */
export interface PageFrontmatter {
  title: string;
  template?: string;
  published?: boolean;
  date?: string;
  taxonomy?: Record<string, string[]>;
  [key: string]: unknown;
}
