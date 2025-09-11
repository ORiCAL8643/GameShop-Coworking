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

const API_URL = "http://localhost:8088";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "API request failed");
  }
  return res.json() as Promise<T>;
}

// ---------- helpers: normalize keys (รองรับ snake/camel/Upper) ----------
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
    id: id ?? row.id,
    ID: id ?? row.ID,
    Id: id ?? row.Id,

    game_id: game_id ?? row.game_id,
    gameId: game_id ?? row.gameId,
    GameID: game_id ?? row.GameID,

    user_id: user_id ?? row.user_id,
    userId: user_id ?? row.userId,
    UserID: user_id ?? row.UserID,
  };
}

// ------------------------------- Games -------------------------------
export async function listGames(token?: string): Promise<Game[]> {
  const res = await fetch(`${API_URL}/game`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return handleResponse<Game[]>(res);
}

export async function getGame(id: number, token?: string): Promise<Game> {
  const games = await listGames(token);
  const found = games.find((g: any) => (g?.ID ?? g?.id ?? g?.Id) === id);
  if (!found) throw new Error(`Game ${id} not found`);
  return found;
}

// ----------------------------- UserGames -----------------------------
export async function listUserGames(userId: number, token?: string): Promise<UserGame[]> {
  const url = new URL(`${API_URL}/user-games`);
  url.searchParams.set("user_id", String(userId));
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const rows = await handleResponse<any[]>(res);
  return (rows ?? []).map((r) => addAliases<UserGame>(r));
}

// ------------------------------- Mods --------------------------------
export async function listMods(gameId?: number, token?: string): Promise<Mod[]> {
  const res = await fetch(`${API_URL}/mods`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  let mods = await handleResponse<Mod[]>(res);
  if (gameId !== undefined) {
    mods = mods.filter(
      (m: any) => (m?.game_id ?? m?.gameId ?? m?.GameID) === gameId
    );
  }
  return mods;
}

export async function getMod(id: number, token?: string): Promise<Mod> {
  const res = await fetch(`${API_URL}/mods/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return handleResponse<Mod>(res);
}

export async function createMod(formData: FormData, authToken?: string): Promise<Mod> {
  const res = await fetch(`${API_URL}/mods`, {
    method: "POST",
    body: formData, // อย่าตั้ง Content-Type เอง
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  });
  return handleResponse<Mod>(res);
}

export async function updateMod(
  id: number,
  payload: Partial<Pick<Mod, "title" | "description" | "game_id" | "user_game_id">>,
  authToken?: string
): Promise<Mod> {
  const res = await fetch(`${API_URL}/mods/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Mod>(res);
}

// ----------------------------- Comments ------------------------------
export async function listComments(threadId: number, token?: string): Promise<Comment[]> {
  const url = new URL(`${API_URL}/comments`);
  url.searchParams.set("thread_id", String(threadId));
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return handleResponse<Comment[]>(res);
}

export async function createComment(payload: CreateCommentRequest, token?: string): Promise<Comment> {
  const res = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  return handleResponse<Comment>(res);
}

// --------------------------- Mod Ratings -----------------------------
export async function listModRatings(modId: number, token?: string): Promise<ModRating[]> {
  const res = await fetch(`${API_URL}/modratings`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const ratings = await handleResponse<ModRating[]>(res);
  return ratings.filter((r: any) => (r?.mod_id ?? r?.modId ?? r?.ModID) === modId);
}

export async function createModRating(payload: CreateModRatingRequest, token?: string): Promise<ModRating> {
  const res = await fetch(`${API_URL}/modratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  return handleResponse<ModRating>(res);
}
