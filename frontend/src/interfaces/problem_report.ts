import type { ProblemAttachment } from "./problem_attachment";
import type { User } from "./User";
import type { Game } from "./Game";

/**
 * รูปแบบที่ service จะ normalize ให้เสมอ:
 *  - ID: number (พิมพ์ใหญ่ เพราะมาจาก gorm.Model)
 *  - ที่เหลือเป็นตัวพิมพ์เล็กตาม json ของ backend
 */
export interface ProblemReport {
  ID: number;

  title: string;
  description: string;
  status: string;

  created_at?: string;
  resolved_at?: string;

  user_id: number;
  game_id: number;

  user?: User;
  game?: Game;

  attachments?: ProblemAttachment[];
}
