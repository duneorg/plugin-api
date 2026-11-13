/**
 * Pure helpers for Dune's content and URL conventions.
 *
 * A plugin that reads or writes content files has to agree with core on these
 * rules (`01.page` numeric prefixes, `default.de.md` language variants, which
 * files are media), and one copy here guarantees it. Core keeps its own
 * implementations; its conformance tests compare the two on fixtures so they
 * cannot drift.
 *
 * @module
 */

import type { ContentFormat, PageFrontmatter } from "./page-index.ts";

const FORMAT_MAP: Record<string, ContentFormat> = {
  ".md": "md",
  ".tsx": "tsx",
  ".mdx": "mdx",
};

const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
  ".mp4",
  ".webm",
  ".ogg",
  ".mp3",
  ".wav",
  ".pdf",
  ".zip",
  ".json",
  ".csv",
  ".html",
]);

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".json": "application/json",
  ".csv": "text/csv",
  ".html": "text/html",
};

/** What a content filename says about the page it holds. */
export interface ContentFileInfo {
  /** Template name (for `.md`/`.mdx`) or `"self"` (for `.tsx`). */
  template: string;
  /** Content format. */
  format: ContentFormat;
  /** File extension, with the dot. */
  ext: string;
  /** The original filename. */
  raw: string;
  /** Language code, when the name is `{template}.{lang}.{ext}` and `lang` is supported. */
  language?: string;
}

/** Parse a content filename into template, format, extension and optional language. */
export function parseContentFilename(
  name: string,
  supportedLanguages?: string[],
): ContentFileInfo | null {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const ext = name.slice(dotIndex);
  const format = FORMAT_MAP[ext];
  if (!format) return null;

  const baseName = name.slice(0, dotIndex);

  // "01.my-article" → "my-article" for flat pages
  const numMatch = baseName.match(/^(\d+)\.(.*)/);
  const templateBase = numMatch ? numMatch[2] : baseName;

  if (supportedLanguages && supportedLanguages.length > 0 && format !== "tsx") {
    const lastDot = templateBase.lastIndexOf(".");
    if (lastDot !== -1) {
      const possibleLang = templateBase.slice(lastDot + 1);
      const template = templateBase.slice(0, lastDot);
      if (
        possibleLang.length >= 2 &&
        supportedLanguages.includes(possibleLang.toLowerCase())
      ) {
        return {
          template,
          format,
          ext,
          raw: name,
          language: possibleLang.toLowerCase(),
        };
      }
    }
  }

  return {
    template: format === "tsx" ? "self" : templateBase,
    format,
    ext,
    raw: name,
  };
}

/** The URL slug of one content folder name: `01.blog` → `blog`, `_part` → `part`. */
function folderSlug(name: string): string {
  if (name.startsWith("_")) return name.slice(1);
  const numMatch = name.match(/^(\d+)\.(.*)/);
  return numMatch ? numMatch[2] : name;
}

/**
 * Convert a content directory path to a URL route prefix by stripping the
 * numeric prefix from each segment: `04.blog/01.post` → `/blog/post`, `""` → `""`.
 */
export function dirPathToRoute(dirPath: string): string {
  if (!dirPath || dirPath === ".") return "";
  return "/" + dirPath.split("/")
    .filter(Boolean)
    .map(folderSlug)
    .join("/");
}

/** Whether a filename is a media file Dune serves from a page folder. */
export function isMediaFile(name: string): boolean {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1) return false;
  return MEDIA_EXTENSIONS.has(name.slice(dotIndex).toLowerCase());
}

/** MIME type by filename extension; `application/octet-stream` when unknown. */
export function getMimeType(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const ext = dot === -1 ? "" : filename.slice(dot).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

/**
 * The `<title>` text for a page: `Title - Descriptor | Site`, `Title | Site`,
 * or just the site name when the page has no title.
 */
export function buildPageTitle(
  page:
    | { frontmatter: Partial<Pick<PageFrontmatter, "title" | "descriptor">> }
    | undefined
    | null,
  siteName: string,
): string {
  if (!page?.frontmatter?.title) return siteName;

  const { title, descriptor } = page.frontmatter;
  const pagePart = descriptor ? `${title} - ${descriptor}` : title;
  return `${pagePart} | ${siteName}`;
}

/** ISO 639-1 codes whose primary script is right-to-left. */
const RTL_LANGUAGES = new Set([
  "ar",
  "he",
  "fa",
  "ur",
  "ps",
  "yi",
  "ug",
  "ku",
  "sd",
  "dv",
  "ks",
  "pa",
]);

/**
 * True when the BCP-47 tag (`ar`, `ar-SA`) uses a right-to-left script. `extra`
 * adds codes, e.g. `system.languages.rtl_override`.
 */
export function isRtl(lang: string, extra?: string[]): boolean {
  const base = lang.split("-")[0].toLowerCase();
  return RTL_LANGUAGES.has(base) || (extra?.includes(base) ?? false);
}
