/**
 * Lightweight page reference used by the content API and search engines.
 *
 * Wider than the theme contract's `PageIndex` on purpose: a search engine
 * returns the entries core handed it inside its results, and core reads
 * `mtime` and `hash` off them. Treat the cache and gating fields as opaque
 * (pass them through unchanged; do not build entries by hand).
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
  /** `publish_date` as epoch ms, when set and valid. */
  publishAt?: number;
  /** `unpublish_date` as epoch ms, when set and valid. */
  unpublishAt?: number;
  /** True when the page is role-gated. Opaque: pass through. */
  gated?: boolean;
  /** Raw `frontmatter.roles` when gated. Opaque: pass through. */
  roles?: unknown;
  /** File modification time, for cache invalidation. Opaque: pass through. */
  mtime: number;
  /** Hash of the frontmatter, for change detection. Opaque: pass through. */
  hash: string;
  /** URL path to the cover image, derived from `frontmatter.image`. */
  coverImage?: string;
  /** When set, visiting the route redirects to this URL (a media file). */
  fileUrl?: string;
  /** Taxonomy term this page is the term page for, normalised to `{ vocab: value }`. */
  termPageFor?: Record<string, string>;
  /** Site-declared custom frontmatter fields extracted for facet filtering. */
  extra?: Record<string, string | string[]>;
}
