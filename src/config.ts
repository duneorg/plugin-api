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
  /** Feed generation settings (`enabled` defaults to true). */
  feed?: { enabled?: boolean };
  /** The editorial workflow, when the site defines one. */
  workflow?: unknown;
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
  /** Extra language codes to treat as right-to-left (`isRtl`'s `extra`). */
  rtl_override?: string[];
}

/** Engine behaviour a plugin may depend on. */
export interface SystemConfig {
  content: {
    /** Content directory relative to the site root. */
    dir: string;
    /**
     * Roles permitted to create or save pages with `format: tsx` (default
     * `["admin"]`; `[]` disables TSX content).
     */
    allow_tsx_format?: string[];
  };
  languages: LanguageConfig;
  debug: boolean;
  /** True when the site runs behind a trusted reverse proxy (`X-Forwarded-For` is honoured). */
  trusted_proxies?: boolean;
  /** Metrics collection (`enabled` defaults to true). */
  metrics?: { enabled?: boolean };
  /** The rendered-page cache (`enabled` defaults to false). */
  page_cache?: { enabled?: boolean };
}

/** The loaded site configuration, as a plugin sees it. Read-only. */
export interface DuneConfig {
  site: SiteConfig;
  system: SystemConfig;
  theme: ThemeConfig;
  /** Per-plugin settings, keyed by plugin name. */
  plugins: Record<string, Record<string, unknown>>;
  /** The plugin entries listed in `site.yaml` (`{ src, config? }`), for introspection. */
  pluginList?: readonly unknown[];
}
