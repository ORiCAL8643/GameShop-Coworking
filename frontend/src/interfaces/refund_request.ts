import type { RefundAttachment } from "./refund_attachment";

export interface RefundRequest {
  ID: number;
  OrderID: number;
  UserID: number;
  Reason: string;
  RequestDate?: string;     // time.Time ใน Go => string ISO ใน TS
  ProcessedDate?: string;   // optional เพราะอาจยังไม่ถูกประมวลผล
  Amount: number;
  RefundStatusID: number;

  Attachments?: RefundAttachment[]; // preload attachments ได้
}

// สำหรับสร้างใหม่ผ่าน API
export interface CreateRefundRequest {
  OrderID: number;
  UserID: number;
  Reason: string;
  RequestDate?: string;
  Amount: number;
  RefundStatusID: number;
}

// สำหรับ backward compatibility หรือการใช้งานเก่า
export interface RefundRequestInterface {
  ID: number;
  OrderID: number;
  UserID: number;
  Reason: string;
  RequestDate?: string;
  ProcessedDate?: string;
  Amount: number;
  RefundStatusID: number;

  Attachments?: RefundAttachment[];
}
