import type { RefundRequest } from "./refund_request";

export interface RefundStatus {
  ID: number;
  StatusName: string;

  RefundRequests?: RefundRequest[]; // preload refund requests
}

// สำหรับสร้างสถานะใหม่ผ่าน API
export interface CreateRefundStatus {
  StatusName: string;
}

// สำหรับ backward compatibility
export interface RefundStatusInterface {
  ID: number;
  StatusName: string;

  RefundRequests?: RefundRequest[];
}
