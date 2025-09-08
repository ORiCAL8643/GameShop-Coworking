import type { Promotion } from "../interfaces/Promotion";
import type { Game } from "../interfaces/Game";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }
  return res.json() as Promise<T>;
}

export async function listPromotions(withGames = false): Promise<Promotion[]> {
  const url = new URL(`${API_URL}/promotions`);
  if (withGames) url.searchParams.set("with", "games");
  const res = await fetch(url.toString());
  return handleResponse<Promotion[]>(res);
}

export async function getPromotion(
  id: number,
  withGames = false,
): Promise<Promotion> {
  const url = new URL(`${API_URL}/promotions/${id}`);
  if (withGames) url.searchParams.set("with", "games");
  const res = await fetch(url.toString());
  return handleResponse<Promotion>(res);
}

export async function createPromotion(payload: FormData, token?: string): Promise<Promotion> {
  const res = await fetch(`${API_URL}/promotions`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: payload,
  });
  return handleResponse<Promotion>(res);
}

export async function updatePromotion(
  id: number,
  payload: FormData,
  token?: string,
): Promise<Promotion> {
  const res = await fetch(`${API_URL}/promotions/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: payload,
  });
  return handleResponse<Promotion>(res);
}

export async function deletePromotion(id: number, token?: string): Promise<void> {
  const res = await fetch(`${API_URL}/promotions/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }
}

export async function listGames(): Promise<Game[]> {
  const res = await fetch(`${API_URL}/game`);
  return handleResponse<Game[]>(res);
}

