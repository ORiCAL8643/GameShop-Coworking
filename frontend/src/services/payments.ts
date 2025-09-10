import type { Order } from "../interfaces/Order";
import type { Payment } from "../interfaces/Payment";
import type { PaymentSlip } from "../interfaces/PaymentSlip";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }
  return res.json() as Promise<T>;
}

export interface CheckoutItem {
  game_id: number;
  quantity: number;
}

export interface CheckoutRequest {
  games: CheckoutItem[];
}

export interface CheckoutResponse {
  order: Order;
  payment: Payment;
}

export async function checkout(payload: CheckoutRequest, token?: string): Promise<CheckoutResponse> {
  const res = await fetch(`${API_URL}/payments/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<CheckoutResponse>(res);
}

export async function uploadPaymentSlip(payload: FormData, token?: string): Promise<PaymentSlip> {
  const res = await fetch(`${API_URL}/payment_slips`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: payload,
  });
  return handleResponse<PaymentSlip>(res);
}
