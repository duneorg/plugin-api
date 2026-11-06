/**
 * Scheduled page actions.
 *
 * @module
 */

/** Scheduled action */
export interface ScheduledAction {
  /** Unique ID */
  id: string;
  /** Source path of the page */
  sourcePath: string;
  /** Action to perform */
  action: "publish" | "unpublish" | "archive";
  /** When to perform the action (epoch ms) */
  scheduledAt: number;
  /** When this was created */
  createdAt: number;
  /** Who scheduled it */
  createdBy?: string;
}

/** A workflow stage identifier — built-in or custom */
export type ContentStatus = string;

/** A single workflow stage definition */
export interface WorkflowStage {
  /** Unique identifier — used as the status value in frontmatter */
  id: string;
  /** Display label */
  label: string;
  /**
   * Badge color for admin UI.
   * Named colors: "amber" | "blue" | "green" | "gray" | "orange" | "teal" | "red" | "purple"
   * Hex values are also accepted (e.g. "#f59e0b").
   */
  color?: string;
  /**
   * When true, transitioning to this stage sets page.published = true.
   * When false/absent, sets page.published = false.
   */
  publish?: boolean;
  /**
   * Terminal stage — no transitions away from this stage are allowed unless
   * explicitly defined. Informational only; the engine uses the transitions array.
   */
  terminal?: boolean;
}

/** A single allowed transition between stages */
export interface WorkflowTransition {
  from: string;
  to: string;
  /** Human-readable label for the transition button */
  label?: string;
  /**
   * Roles that can perform this transition.
   * If omitted or empty, any authenticated user can perform it.
   * Valid values: "admin" | "editor" | "author"
   */
  roles?: string[];
}
