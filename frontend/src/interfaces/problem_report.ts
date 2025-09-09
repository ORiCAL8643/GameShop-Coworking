import type { ProblemAttachment } from "./problem_attachment";
import type { User } from "./User";
import type { Game } from "./Game";

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

