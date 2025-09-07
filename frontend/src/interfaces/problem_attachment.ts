export interface ProblemAttachment {
  ID: number;
  FilePath: string;
  UploadedAt?: string; // optional เพราะบางกรณีอาจยังไม่เซ็ต
  ReportID: number;
}

// สำหรับสร้างใหม่ผ่าน API
export interface CreateProblemAttachmentRequest {
  FilePath: string;
  UploadedAt?: string;
  ReportID: number;
}

// สำหรับ backward compatibility หรือการใช้งานเก่า
export interface ProblemAttachmentInterface {
  ID: number;
  FilePath: string;
  UploadedAt?: string;
  ReportID: number;
}
