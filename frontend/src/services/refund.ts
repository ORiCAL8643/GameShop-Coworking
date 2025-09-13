export const API_URL =
  (import.meta as any)?.env?.VITE_API_URL || "http://localhost:8088";

async function parseResponse(res: Response) {
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    try {
      data = { error: await res.text() };
    } catch {
      data = { error: "Unknown error" };
    }
  }
  if (!res.ok) {
    const err: any = new Error(data?.error || "Request failed");
    err.response = { data };
    throw err;
  }
  return data;
}

export async function createRefund(payload: {
  order_id: number;
  user_id: number;
  reason: string;
  amount?: number;
}): Promise<any> {
  const res = await fetch(`${API_URL}/refunds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function fetchRefunds(userId?: number): Promise<any[]> {
  const url = new URL(`${API_URL}/refunds`);
  if (userId) url.searchParams.set("user_id", String(userId));
  const res = await fetch(url.toString());
  const data = await parseResponse(res);
  return Array.isArray(data) ? data : data?.data || [];
}

export async function updateRefundStatus(
  id: number,
  status: string
): Promise<any> {
  const res = await fetch(`${API_URL}/refunds/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseResponse(res);
}
