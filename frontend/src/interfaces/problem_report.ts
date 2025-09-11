import type { ProblemAttachment } from "./problem_attachment";
import type { User } from "./User";

// ====== Reply types ======
export interface ProblemReplyAttachment {
  ID: number;
  file_path: string;
  reply_id: number;
}

export interface ProblemReply {
  ID: number;
  report_id: number;
  admin_id: number;
  message: string;
  created_at?: string;
  attachments?: ProblemReplyAttachment[];
}

/** รูปแบบ ProblemReport ตาม backend (gorm.Model) */
export interface ProblemReport {
  ID: number;
  title: string;
  description: string;
  category: string;
  status: string; // "pending" | "resolved"

  user_id: number;
  user?: User;

  created_at?: string;
  updated_at?: string;
  resolved_at?: string;

  attachments?: ProblemAttachment[];
  replies?: ProblemReply[];
}
