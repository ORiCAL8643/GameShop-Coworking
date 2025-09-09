import type {
  Game,
  UserGame,
  Mod,
  Comment,
  CreateCommentRequest,
  ModRating,
  CreateModRatingRequest,
} from "../interfaces";

const API_URL = 'http://localhost:8088';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }
  return res.json() as Promise<T>;
}

// 🔧 ปรับให้ตรง backend ปัจจุบัน
export async function listGames(): Promise<Game[]> {
  // backend ใช้ /game (เอกพจน์) สำหรับลิสต์ทั้งหมด
  const res = await fetch(`${API_URL}/game`);
  return handleResponse<Game[]>(res);
}

// 🔧 backend ยังไม่มี GET /games/:id → ดึงทั้งหมดแล้วกรองเอา id ที่ต้องการ
export async function getGame(id: number): Promise<Game> {
  const games = await listGames();
  const found = games.find((g) => g.ID === id);
  if (!found) throw new Error(`Game ${id} not found`);
  return found;
}

export async function listUserGames(userId: number): Promise<UserGame[]> {
  // ตรงกับ backend: GET /user-games?user_id=...
  const url = new URL(`${API_URL}/user-games`);
  url.searchParams.set("user_id", String(userId));
  const res = await fetch(url.toString());
  return handleResponse<UserGame[]>(res);
}

// ด้านล่างนี้แล้วแต่ระบบคุณว่ามี endpoint จริงไหม
export async function listMods(gameId?: number): Promise<Mod[]> {
  const res = await fetch(`${API_URL}/mods`); // ถ้า backend ยังไม่มี จะ 404
  let mods = await handleResponse<Mod[]>(res);
  if (gameId !== undefined) {
    mods = mods.filter((m) => m.game_id === gameId);
  }
  return mods;
}

export async function getMod(id: number): Promise<Mod> {
  const res = await fetch(`${API_URL}/mods/${id}`); // ถ้า backend ยังไม่มี จะ 404
  return handleResponse<Mod>(res);
}

export async function createMod(formData: FormData): Promise<Mod> {
  const res = await fetch(`${API_URL}/mods`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<Mod>(res);
}

export async function listComments(threadId: number): Promise<Comment[]> {
  const url = new URL(`${API_URL}/comments`);
  url.searchParams.set("thread_id", String(threadId));
  const res = await fetch(url.toString());
  return handleResponse<Comment[]>(res);
}

export async function createComment(payload: CreateCommentRequest): Promise<Comment> {
  const res = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Comment>(res);
}

export async function listModRatings(modId: number): Promise<ModRating[]> {
  const res = await fetch(`${API_URL}/modratings`); // ถ้า backend ยังไม่มี จะ 404
  const ratings = await handleResponse<ModRating[]>(res);
  return ratings.filter((r) => r.mod_id === modId);
}

export async function createModRating(payload: CreateModRatingRequest): Promise<ModRating> {
  const res = await fetch(`${API_URL}/modratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<ModRating>(res);
}
