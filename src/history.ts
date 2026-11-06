/**
 * Revision history.
 *
 * @module
 */

/** Records page revisions and provides diff and restore capabilities. Obtain via {@link createHistoryEngine}. */
export interface HistoryEngine {
  /** Record a new revision for a page */
  record(input: RecordInput): Promise<ContentRevision>;
  /** Get revision history for a page (newest first) */
  getHistory(sourcePath: string, limit?: number): Promise<ContentRevision[]>;
  /** Get a specific revision */
  getRevision(
    sourcePath: string,
    revisionNumber: number,
  ): Promise<ContentRevision | null>;
  /** Get the latest revision for a page */
  getLatest(sourcePath: string): Promise<ContentRevision | null>;
  /** Compute diff between two revisions */
  diff(
    sourcePath: string,
    fromRev: number,
    toRev: number,
  ): Promise<ContentDiff | null>;
  /** Compute diff between a revision and current content */
  diffWithCurrent(
    sourcePath: string,
    revisionNumber: number,
    currentContent: string,
  ): Promise<ContentDiff | null>;
  /** Get total revision count for a page */
  getRevisionCount(sourcePath: string): Promise<number>;
}

/** Input for {@link HistoryEngine.record} — captures a page revision. */
export interface RecordInput {
  sourcePath: string;
  content: string;
  frontmatter: Record<string, unknown>;
  author?: string;
  message?: string;
}

/** Content revision record */
export interface ContentRevision {
  /** Unique revision ID */
  id: string;
  /** Source path of the page */
  sourcePath: string;
  /** Revision number (sequential per page) */
  number: number;
  /** Complete page content at this revision */
  content: string;
  /** Frontmatter snapshot */
  frontmatter: Record<string, unknown>;
  /** Who made this change */
  author?: string;
  /** When this revision was created */
  createdAt: number;
  /** Description of what changed */
  message?: string;
}

/** Diff between two revisions */
export interface ContentDiff {
  /** Lines added */
  additions: number;
  /** Lines removed */
  deletions: number;
  /** Unified diff format */
  patch: string;
}
