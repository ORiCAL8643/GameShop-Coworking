import type { ProblemAttachment } from "./problem_attachment";
import type { ProblemReply } from "../interfaces/problem_reply";
import type { User } from "./User";
import type { Game } from "./Game";

/**
 * รูปแบบ ProblemReport ตาม backend (gorm.Model)
 * - ID: number (พิมพ์ใหญ่เพราะ GORM คืนมาเป็น "ID")
 * - field อื่นเป็น lower_case ตาม json
 */
export interface ProblemReport {
  ID: number;             // primary key

  title: string;
  description: string;
  status: string;         // "pending" | "resolved"

  created_at?: string;
  resolved_at?: string;

  // foreign keys
  user_id: number;        // ✅ ใช้ตัวนี้ตอน createNotification
  game_id: number;

  // preload relations
  user?: User;
  game?: Game;

  // admin reply
  reply?: string; // latest reply message

  // attachments
  attachments?: ProblemAttachment[];

  // all replies from admin
  replies?: ProblemReply[];
}