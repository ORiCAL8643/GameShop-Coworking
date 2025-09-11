// src/interfaces/Notification.ts
import type { User } from "./User";
import type { ProblemReport } from "./problem_report";

export interface Notification {
  ID: number;

  title: string;
  message: string;
  type: string;          // e.g. "report_reply", "refund", "system"

  user_id: number;
  user?: User;

  is_read: boolean;      // ให้เป็น boolean ชัดเจน (ไม่ต้อง optional)
  created_at?: string;
  updated_at?: string;

  // ✅ อ้างอิงไปยังคำร้อง/รีพอร์ต เพื่อเปิดดูข้อความ/ไฟล์แนบใน UI
  report_id?: number;
  report?: ProblemReport;
}

export interface CreateNotificationRequest {
  title: string;
  type: string;
  message: string;
  user_id: number;

  // ✅ ระบุ report ที่เกี่ยวข้อง (ถ้ามี)
  report_id?: number;
}

export interface UpdateNotificationRequest {
  ID: number;
  title?: string;
  type?: string;
  message?: string;
}