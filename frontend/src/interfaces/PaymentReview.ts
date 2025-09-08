import type { User } from "./User";

export interface PaymentReview {
  ID: number;
  verified_at: string; // ISO datetime
  title: string;
  result: string;      // "approved" | "rejected" | ...
  note: string;

  user_id: number;     // ผู้ตรวจ
  user?: User;
}

export interface CreatePaymentReviewRequest {
  verified_at?: string;
  title: string;
  result: string;
  note: string;
  user_id: number;
}
