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
