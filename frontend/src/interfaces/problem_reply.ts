import type { User } from "./User";

export interface ProblemReplyAttachment {
  ID: number;
  file_path: string;
  FilePath?: string;
  original_name?: string;
  OriginalName?: string;
  reply_id: number;
}

export interface ProblemReply {
  ID: number;
  report_id: number;
  admin_id: number;
  message: string;
  admin?: User;
  attachments?: ProblemReplyAttachment[];
}