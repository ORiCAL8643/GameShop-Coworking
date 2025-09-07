export interface RefundAttachment {
  ID: number;
  FilePath: string;
  UploadedAt?: string; // เวลาใน Go เป็น time.Time => ใน TS ใช้ string ISO
  RefundID: number;
}

// สำหรับสร้างใหม่ผ่าน API
export interface CreateRefundAttachmentRequest {
  FilePath: string;
  UploadedAt?: string; // optional เวลาสร้างอาจยังไม่ได้ส่ง
  RefundID: number;
}

// สำหรับ backward compatibility หรือการใช้งานเก่า
export interface RefundAttachmentInterface {
  ID: number;
  FilePath: string;
  UploadedAt?: string;
  RefundID: number;
}
