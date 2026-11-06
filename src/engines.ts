/**
 * The core subsystems an admin drives: editorial workflow, the scheduler for timed actions, and staged drafts.
 *
 * @module
 */

import type { PageIndex } from "./page-index.ts";
import type {
  ContentStatus,
  ScheduledAction,
  WorkflowStage,
  WorkflowTransition,
} from "./workflow.ts";

/** Manages content status transitions and workflow queries. Obtain via {@link createWorkflowEngine}. */
export interface WorkflowEngine {
  /** All configured stages */
  stages: WorkflowStage[];
  /** Get the effective status for a page (from frontmatter or default) */
  getStatus(page: PageIndex): ContentStatus;
  /** Check if a transition is valid, optionally scoped to a user role */
  canTransition(from: ContentStatus, to: ContentStatus, role?: string): boolean;
  /** Get allowed target statuses from a status, optionally filtered by role */
  allowedTransitions(from: ContentStatus, role?: string): ContentStatus[];
  /** Full transition objects from a status, optionally filtered by role */
  allowedTransitionObjects(
    from: ContentStatus,
    role?: string,
  ): WorkflowTransition[];
  /** Whether transitioning to `to` should set published=true on the page */
  setsPublished(to: ContentStatus): boolean;
  /** Find pages by status */
  findByStatus(pages: PageIndex[], status: ContentStatus): PageIndex[];
  /** Get status counts */
  statusCounts(pages: PageIndex[]): Record<string, number>;
}

/** Schedules and executes time-based publish/unpublish/archive actions. Obtain via {@link createScheduler}. */
export interface Scheduler {
  /** Schedule a new action */
  schedule(
    action: Omit<ScheduledAction, "id" | "createdAt">,
  ): Promise<ScheduledAction>;
  /** Cancel a scheduled action */
  cancel(id: string): Promise<boolean>;
  /** List all pending actions */
  list(): Promise<ScheduledAction[]>;
  /** List actions for a specific page */
  listForPage(sourcePath: string): Promise<ScheduledAction[]>;
  /** Check and execute due actions (called by timer) */
  tick(onAction: (action: ScheduledAction) => Promise<void>): Promise<number>;
  /** Start the scheduler polling loop */
  start(onAction: (action: ScheduledAction) => Promise<void>): void;
  /** Stop the scheduler */
  stop(): void;
}

/** Manages staged drafts and their shareable preview tokens. Obtain via {@link createStagingEngine}. */
export interface StagingEngine {
  /**
   * Create or update a staged draft for a page.
   * Generates a new random token if no draft exists, preserves the token
   * on updates so existing preview URLs remain valid.
   */
  upsert(input: UpsertInput): Promise<StagedDraft>;
  /** Get the current draft for a page (null if none). */
  get(sourcePath: string): Promise<StagedDraft | null>;
  /** Delete a staged draft (discard). */
  discard(sourcePath: string): Promise<void>;
  /**
   * Verify that a token matches the stored draft for a page.
   * Returns the draft on success, null if token is wrong or draft missing.
   */
  verify(sourcePath: string, token: string): Promise<StagedDraft | null>;
}

/** An unpublished draft of a page, stored alongside revision history. */
export interface StagedDraft {
  /** Source path of the page (e.g. "01.home/default.md") */
  sourcePath: string;
  /** Markdown / MDX / TSX content body */
  content: string;
  /** Frontmatter fields */
  frontmatter: Record<string, unknown>;
  /** Opaque hex token used to authenticate the preview URL */
  token: string;
  /** Unix ms timestamp when the draft was created/last updated */
  updatedAt: number;
  /** Admin username who created the draft */
  createdBy?: string;
}

/** Input for {@link StagingEngine.upsert}. */
export interface UpsertInput {
  sourcePath: string;
  content: string;
  frontmatter: Record<string, unknown>;
  createdBy?: string;
}
