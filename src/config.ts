/**
 * The slice of the site configuration a plugin may read.
 *
 * Core's `DuneConfig` is large and most of it is core's own business. These
 * interfaces name only what plugins read; core's config is assignable to them,
 * and adding a field here later is additive while removing one is breaking.
 * Keys a plugin needs beyond this belong in its own `plugins.<name>` section.
 *
 * @module
 */

/** Site identity. */
export interface SiteConfig {
  title: string;
  description: string;
  /** Canonical site URL, including any path prefix the site is served under. */
  url: string;
  /** Taxonomy names declared for the site (e.g. `["category", "tag"]`). */
  taxonomies: string[];
}

/** The active theme. */
export interface ThemeConfig {
  /** Active theme name. */
  name: string;
}

/** Language settings. */
export interface LanguageConfig {
  supported: string[];
  default: string;
  include_default_in_url: boolean;
}

/** Engine behaviour a plugin may depend on. */
export interface SystemConfig {
  content: {
    /** Content directory relative to the site root. */
    dir: string;
  };
  languages: LanguageConfig;
  debug: boolean;
}

/** The loaded site configuration, as a plugin sees it. Read-only. */
export interface DuneConfig {
  site: SiteConfig;
  system: SystemConfig;
  theme: ThemeConfig;
  /** Per-plugin settings, keyed by plugin name. */
  plugins: Record<string, Record<string, unknown>>;
}
