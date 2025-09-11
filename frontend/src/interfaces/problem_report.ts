// src/interfaces/problem_report.ts

export interface ProblemAttachment {
  ID: number;
  file_path: string;
  created_at: string;
  report_id: number;
}

export interface ProblemReplyAttachment {
  ID: number;
  file_path: string;
  created_at: string;
  reply_id: number;
}

// ✅ Reply จากแอดมิน
export interface ProblemReply {
  id: number;
  report_id: number;
  admin_id: number;
  message: string;
  created_at: string;
  attachments: ProblemReplyAttachment[];
}

// ✅ รายงานปัญหาจากลูกค้า
export interface ProblemReport {
  reply: any;
  ID: number;
  title: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;

  // ความสัมพันธ์
  user?: {
    ID: number;
    username: string;
    email: string;
  };

  attachments: ProblemAttachment[];
  replies: ProblemReply[];
}
