// src/services/workshop.ts
import type {
  Game,
  UserGame,
  Mod,
  Comment,
  CreateCommentRequest,
  ModRating,
  CreateModRatingRequest,
} from "../interfaces";

const API_URL =
  (import.meta as any)?.env?.VITE_API_BASE ??
  (import.meta as any)?.env?.VITE_API_URL ??
  "http://localhost:8088";

// ---------- response helper (ทนทานกับ 204/หรือ body เป็น text) ----------
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "API request failed");
  }
  const txt = await res.text().catch(() => "");
  if (!txt) return null as unknown as T; // 204/empty
  try {
    return JSON.parse(txt) as T;
  } catch {
    // กรณี backend ส่งเป็น string ธรรมดา
    return txt as unknown as T;
  }
}

// ---------- helpers: normalize keys ----------
const toNum = (v: any): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const pickId = (obj: any) => toNum(obj?.id ?? obj?.ID ?? obj?.Id);
const pickGameId = (obj: any) => toNum(obj?.game_id ?? obj?.gameId ?? obj?.GameID);
const pickUserId = (obj: any) => toNum(obj?.user_id ?? obj?.userId ?? obj?.UserID);

function addAliases<T extends Record<string, any>>(row: T) {
  const id = pickId(row);
  const game_id = pickGameId(row);
  const user_id = pickUserId(row);
  return {
    ...row,
    id: id ?? row.id, ID: id ?? row.ID, Id: id ?? row.Id,
    game_id: game_id ?? row.game_id, gameId: game_id ?? row.gameId, GameID: game_id ?? row.GameID,
    user_id: user_id ?? row.user_id, userId: user_id ?? row.userId, UserID: user_id ?? row.UserID,
  };
}

// ------------------------------- Games -------------------------------
export async function listGames(): Promise<Game[]> {
  const res = await fetch(`${API_URL}/game`);
  return handleResponse<Game[]>(res);
}
export async function getGame(id: number): Promise<Game> {
  const games = await listGames();
  const found = games.find((g: any) => (g?.ID ?? g?.id ?? g?.Id) === id);
  if (!found) throw new Error(`Game ${id} not found`);
  return found;
}

// ----------------------------- UserGames -----------------------------
export async function listUserGames(userId: number): Promise<UserGame[]> {
  const url = new URL(`${API_URL}/user-games`);
  url.searchParams.set("user_id", String(userId));
  const res = await fetch(url.toString());
  const rows = await handleResponse<any[]>(res);
  return (rows ?? []).map((r) => addAliases<UserGame>(r));
}

// ------------------------------- Mods --------------------------------
export async function listMods(gameId?: number): Promise<Mod[]> {
  const url = new URL(`${API_URL}/mods`);
  if (gameId !== undefined) url.searchParams.set("game_id", String(gameId));
  const res = await fetch(url.toString());
  const mods = await handleResponse<Mod[]>(res);
  return mods;
}
export async function getMod(id: number): Promise<Mod> {
  const res = await fetch(`${API_URL}/mods/${id}`);
  return handleResponse<Mod>(res);
}
export async function createMod(
  formData: FormData,
  authToken?: string,
  userId?: number | string
): Promise<Mod> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (userId != null) headers["X-User-ID"] = String(userId);
  const res = await fetch(`${API_URL}/mods`, { method: "POST", body: formData, headers });
  return handleResponse<Mod>(res);
}
export async function updateMod(
  id: number,
  payload: Partial<Pick<Mod, "title" | "description" | "game_id" | "user_game_id">>,
  authToken?: string,
  userId?: number | string
): Promise<Mod> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (userId != null) headers["X-User-ID"] = String(userId);
  const res = await fetch(`${API_URL}/mods/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse<Mod>(res);
}

// ⬇️ ใหม่: เปลี่ยนไฟล์ม็อด/รูปภาพ (ใช้ในโหมดแก้ไข)
export async function replaceModFile(
  id: number,
  file: File,
  authToken?: string,
  userId?: number | string
): Promise<any> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (userId != null) headers["X-User-ID"] = String(userId);

  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/mods/${id}/file`, {
    method: "PUT",
    headers,
    body: fd,
  });
  return handleResponse<any>(res);
}

export async function replaceModImage(
  id: number,
  image: File,
  authToken?: string,
  userId?: number | string
): Promise<any> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (userId != null) headers["X-User-ID"] = String(userId);

  const fd = new FormData();
  fd.append("image", image);
  const res = await fetch(`${API_URL}/mods/${id}/image`, {
    method: "PUT",
    headers,
    body: fd,
  });
  return handleResponse<any>(res);
}

// ----------------------------- Comments ------------------------------
// ใช้ mod_id ให้ตรงกับหน้า ModDetail
export async function listCommentsByMod(modId: number): Promise<Comment[]> {
  const url = new URL(`${API_URL}/comments`);
  url.searchParams.set("mod_id", String(modId));
  const res = await fetch(url.toString());
  const rows = await handleResponse<any[]>(res);
  return (rows ?? []).map((r) => addAliases<Comment>(r));
}
export async function createCommentForMod(payload: CreateCommentRequest): Promise<Comment> {
  // payload: { mod_id, user_id, content }
  const res = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Comment>(res);
}

// --------------------------- Mod Ratings -----------------------------
export async function listModRatings(modId: number): Promise<ModRating[]> {
  const url = new URL(`${API_URL}/modratings`);
  url.searchParams.set("mod_id", String(modId));
  const res = await fetch(url.toString());
  const rows = await handleResponse<any[]>(res);
  return (rows ?? []).map((r) => addAliases<ModRating>(r));
}
export async function createModRating(payload: CreateModRatingRequest): Promise<ModRating> {
  // payload: { mod_id, user_id, score }
  const res = await fetch(`${API_URL}/modratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<ModRating>(res);
}
/** (ออปชัน) ถ้า backend แยกอัปเดตคะแนนเป็น PATCH/PUT */
export async function updateModRating(
  id: number,
  score: number
): Promise<ModRating> {
  const res = await fetch(`${API_URL}/modratings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score }),
  });
  return handleResponse<ModRating>(res);
}
