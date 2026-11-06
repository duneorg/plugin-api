/**
 * Form submission records, as carried by the `onFormSubmit` hook.
 *
 * @module
 */

export interface Submission {
  id: string;
  form: string;
  receivedAt: number; // Unix ms
  status: SubmissionStatus;
  fields: Record<string, string>;
  meta: SubmissionMeta;
  /** Uploaded file attachments (set if form includes file inputs) */
  files?: SubmissionFile[];
}

export interface SubmissionFile {
  /** Original filename from the upload */
  name: string;
  /** Detected MIME type */
  contentType: string;
  /** File size in bytes */
  size: number;
  /** Storage path (relative to storage root), used internally for serving */
  storagePath: string;
}

export type SubmissionStatus = "new" | "read" | "archived";

export interface SubmissionMeta {
  /** Submitter IP (from X-Forwarded-For or request) */
  ip?: string;
  /** Accept-Language header value */
  language?: string;
  /** User-Agent header value */
  userAgent?: string;
}
