import type { Order, CreateOrderRequest, UpdateOrderRequest } from "../interfaces/Order";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }
  return res.json() as Promise<T>;
}

export async function listOrders(token?: string): Promise<Order[]> {
  const res = await fetch(`${API_URL}/orders`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return handleResponse<Order[]>(res);
}

export async function getOrder(id: number, token?: string): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return handleResponse<Order>(res);
}

export async function createOrder(payload: CreateOrderRequest, token?: string): Promise<Order> {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Order>(res);
}

export async function updateOrder(
  id: number,
  payload: Omit<UpdateOrderRequest, "ID">,
  token?: string,
): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Order>(res);
}
