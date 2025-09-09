import type {
  Game,
  UserGame,
  Mod,
  Comment,
  CreateCommentRequest,
  ModRating,
  CreateModRatingRequest,
} from "../interfaces";

const API_URL = import.meta.env.VITE_API_URL as string;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }
  return res.json() as Promise<T>;
}

export async function listGames(): Promise<Game[]> {
  const res = await fetch(`${API_URL}/games`);
  return handleResponse<Game[]>(res);
}

export async function getGame(id: number): Promise<Game> {
  const res = await fetch(`${API_URL}/games/${id}`);
  return handleResponse<Game>(res);
}

export async function listUserGames(userId: number): Promise<UserGame[]> {
  const url = new URL(`${API_URL}/user-games`);
  url.searchParams.set("user_id", String(userId));
  const res = await fetch(url.toString());
  return handleResponse<UserGame[]>(res);
}

export async function listMods(gameId?: number): Promise<Mod[]> {
  const res = await fetch(`${API_URL}/mods`);
  let mods = await handleResponse<Mod[]>(res);
  if (gameId !== undefined) {
    mods = mods.filter((m) => m.game_id === gameId);
  }
  return mods;
}

export async function getMod(id: number): Promise<Mod> {
  const res = await fetch(`${API_URL}/mods/${id}`);
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
  const res = await fetch(`${API_URL}/modratings`);
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
