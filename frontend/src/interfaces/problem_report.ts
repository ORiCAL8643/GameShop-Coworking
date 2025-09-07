import type { ProblemAttachment } from "./problem_attachment";

export interface ProblemReport {
  ID: number;
  Title: string;
  Description: string;
  CreatedAt?: string;    // ใช้ ? เพราะอาจยังไม่ได้เซ็ต
  ResolvedAt?: string;   // ใช้ ? เพราะอาจยังไม่ได้แก้ปัญหา
  Status: string;

  UserID: number;
  GameID: number;

  Attachments?: ProblemAttachment[]; // optional เพื่อให้โหลดเฉพาะตอนต้องการ
}

// สำหรับสร้างใหม่ผ่าน API
export interface CreateProblemReportRequest {
  Title: string;
  Description: string;
  CreatedAt?: string;
  Status: string;
  UserID: number;
  GameID: number;
}

// สำหรับ backward compatibility หรือการใช้งานเก่า
export interface ProblemReportInterface {
  ID: number;
  Title: string;
  Description: string;
  CreatedAt?: string;
  ResolvedAt?: string;
  Status: string;

  UserID: number;
  GameID: number;

  Attachments?: ProblemAttachment[];
}
