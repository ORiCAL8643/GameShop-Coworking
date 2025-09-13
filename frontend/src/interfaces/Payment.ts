import type { Order } from "./Order";
import type { PaymentSlip } from "./PaymentSlip";

export interface Payment {
  ID: number;
  payment_date: string; // ISO datetime
  status: string;       // e.g., "pending", "verifying", "approved", "rejected"
  amount: number;
  reject_reason?: string;

  order_id: number;
  order?: Order;

  payment_slips?: PaymentSlip[];
}

export interface CreatePaymentRequest {
  payment_date?: string;
  status: string;
  amount: number;
  order_id: number;
}

export interface UpdatePaymentRequest {
  ID: number;
  payment_date?: string;
  status?: string;
  amount?: number;
}
