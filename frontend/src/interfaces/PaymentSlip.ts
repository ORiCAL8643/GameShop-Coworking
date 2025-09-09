import type { Payment } from "./Payment";

export interface PaymentSlip {
  ID: number;
  upload_at: string; // ISO datetime
  file_url: string;

  payment_id: number;
  payment?: Payment;
}

export interface CreatePaymentSlipRequest {
  upload_at?: string;
  file_url: string;
  payment_id: number;
}
