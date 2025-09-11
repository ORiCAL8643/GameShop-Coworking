// PATH: src/services/workshop.ts
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
  // บางครั้ง backend อาจคืน "" (ว่าง) แทน JSON → กันไว้
  const txt = await res.text();
  return (txt ? JSON.parse(txt) : (null as any)) as T;
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
    id: id ?? (row as any).id,
    ID: id ?? (row as any).ID,
    Id: id ?? (row as any).Id,

    game_id: game_id ?? (row as any).game_id,
    gameId: game_id ?? (row as any).gameId,
    GameID: game_id ?? (row as any).GameID,

    user_id: user_id ?? (row as any).user_id,
    userId: user_id ?? (row as any).userId,
    UserID: user_id ?? (row as any).UserID,
  };
}

// ช่วย normalize array
const asArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.items)) return v.items;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.rows)) return v.rows;
  return [];
};

/* ------------------------------- Games ------------------------------- */
export async function listGames(): Promise<Game[]> {
  const res = await fetch(`${API_URL}/game`);
  const raw = await handleResponse<any>(res);
  return asArray(raw).map((r: any) => addAliases<Game>(r));
}

export async function getGame(id: number): Promise<Game> {
  const games = await listGames();
  const found = games.find((g: any) => (g?.ID ?? g?.id ?? g?.Id) === id);
  if (!found) throw new Error(`Game ${id} not found`);
  return found;
}

/* ----------------------------- UserGames ----------------------------- */
export async function listUserGames(userId: number): Promise<UserGame[]> {
  const url = new URL(`${API_URL}/user-games`);
  url.searchParams.set("user_id", String(userId));
  const token = localStorage.getItem("token");
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const rows = await handleResponse<any>(res);
  return asArray(rows).map((r) => addAliases<UserGame>(r));
}

/* -------------------------------- Mods -------------------------------- */
export async function listMods(gameId?: number): Promise<Mod[]> {
  const res = await fetch(`${API_URL}/mods`);
  const raw = await handleResponse<any>(res);
  let mods = asArray(raw).map((r) => addAliases<Mod>(r));

  if (gameId !== undefined) {
    mods = mods.filter(
      (m: any) => (m?.game_id ?? m?.gameId ?? m?.GameID) === gameId
    );
  }
  return mods;
}

export async function getMod(id: number): Promise<Mod> {
  const res = await fetch(`${API_URL}/mods/${id}`);
  const raw = await handleResponse<any>(res);
  return addAliases<Mod>(raw);
}

export async function createMod(
  formData: FormData,
  authToken?: string
): Promise<Mod> {
  const res = await fetch(`${API_URL}/mods`, {
    method: "POST",
    body: formData,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  });
  const raw = await handleResponse<any>(res);
  return addAliases<Mod>(raw);
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
  const raw = await handleResponse<any>(res);
  return addAliases<Mod>(raw);
}

/* ----------------------------- Comments ------------------------------ */
export async function listComments(threadId: number): Promise<Comment[]> {
  const url = new URL(`${API_URL}/comments`);
  url.searchParams.set("thread_id", String(threadId));
  const res = await fetch(url.toString());
  const raw = await handleResponse<any>(res);
  return asArray(raw).map((r) => addAliases<Comment>(r));
}

export async function createComment(
  payload: CreateCommentRequest,
  authToken?: string
): Promise<Comment> {
  const res = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const raw = await handleResponse<any>(res);
  return addAliases<Comment>(raw);
}

/* --------------------------- Mod Ratings ----------------------------- */
export async function listModRatings(modId: number): Promise<ModRating[]> {
  const res = await fetch(`${API_URL}/modratings`);
  const raw = await handleResponse<any>(res);
  const ratings = asArray(raw).map((r) => addAliases<ModRating>(r));
  return ratings.filter((r: any) => (r?.mod_id ?? r?.modId ?? r?.ModID) === modId);
}

export async function createModRating(
  payload: CreateModRatingRequest,
  authToken?: string
): Promise<ModRating> {
  const res = await fetch(`${API_URL}/modratings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const raw = await handleResponse<any>(res);
  return addAliases<ModRating>(raw);
}