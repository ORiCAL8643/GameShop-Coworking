import type { Order } from "./Order";
import type { PaymentSlip } from "./PaymentSlip";

export interface Payment {
  ID: number;
  uploaded_at: string; // ISO datetime
  status: string;       // e.g., "pending", "verifying", "approved", "rejected"
  amount: number;

  order_id: number;
  order?: Order;

  payment_slips?: PaymentSlip[];
}

export interface CreatePaymentRequest {
  uploaded_at?: string;
  status: string;
  amount: number;
  order_id: number;
}

export interface UpdatePaymentRequest {
  ID: number;
  uploaded_at?: string;
  status?: string;
  amount?: number;
}
