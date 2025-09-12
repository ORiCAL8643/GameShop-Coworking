// PATH: src/services/games.ts
import type { Game } from "../interfaces";

const API = (import.meta as any)?.env?.VITE_API_URL ?? "http://localhost:8088";

/* ---------- helpers ---------- */
async function okText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

async function okJson<T>(res: Response): Promise<T> {
  // บาง endpoint อาจคืน "" (204/ข้อความเปล่า) → กัน null ไว้
  const text = await okText(res);
  return (text ? JSON.parse(text) : null) as T;
}

const asArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.items)) return v.items;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.rows)) return v.rows;
  return [];
};

const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : undefined);
const pickId = (obj: any) => toNum(obj?.ID ?? obj?.id ?? obj?.Id);

function addAliases<T extends Record<string, any>>(row: T) {
  const id = pickId(row);
  return {
    ...row,
    ID: id ?? (row as any).ID,
    id: id ?? (row as any).id,
    Id: id ?? (row as any).Id,
  } as T;
}

/* ---------- MinimumSpec type ---------- */
export interface MinimumSpec {
  ID?: number;
  GameID?: number;
  // รองรับได้ทั้ง lower/upper case จาก backend
  os?: string; OS?: string;
  cpu?: string; CPU?: string;
  ram?: string; RAM?: string;
  gpu?: string; GPU?: string;
  storage?: string; Storage?: string;
}

/* ---------- Games ---------- */

/** ลิสต์เกมทั้งหมด (พยายามใช้ /game เป็นหลัก และ fallback ไป /games) */
export async function listGames(): Promise<Game[]> {
  // try /game ก่อน (ตรงกับโปรเจกต์คุณ)
  let res = await fetch(`${API}/game`, { credentials: "include" });
  if (!res.ok) {
    // fallback: /games (บางสาขาเคยใช้ path นี้)
    res = await fetch(`${API}/games`, { credentials: "include" });
  }
  if (!res.ok) {
    throw new Error((await okText(res)) || "Failed to list games");
  }
  const raw = await okJson<any>(res);
  return asArray(raw).map((r: any) => addAliases<Game>(r));
}

/** ดึงเกมตาม id: พยายามยิง /games/:id ก่อน แล้วค่อย fallback ไป list แล้ว find */
export async function getGameById(id: number): Promise<Game> {
  // ลอง endpoint ตรงก่อน (ถ้า backend มี)
  try {
    const res = await fetch(`${API}/games/${id}`, { credentials: "include" });
    if (res.ok) {
      const g = await okJson<any>(res);
      return addAliases<Game>(g);
    }
  } catch {
    /* noop → ไป fallback */
  }
  // fallback: โหลดทั้งหมดแล้วหา
  const all = await listGames();
  const found = all.find((g: any) => (g?.ID ?? g?.id) === id);
  if (!found) throw new Error(`Game ${id} not found`);
  return found;
}

/* ---------- MinimumSpec (per game) ---------- */

/**
 * ดึง Minimum Spec ของเกมเดียว
 * แนะนำให้มี backend route: GET /games/:id/minimumspec
 * ถ้ายังไม่มี → fallback ไป /minimumspec?game_id=ID แล้วคืนตัวแรก
 */
export async function getMinimumSpecByGameId(gameId: number): Promise<MinimumSpec | null> {
  // ทางหลัก: nested resource (REST ชัดเจน)
  try {
    const res = await fetch(`${API}/games/${gameId}/minimumspec`, {
      credentials: "include",
    });
    if (res.status === 404) return null;
    if (res.ok) return (await okJson<MinimumSpec>(res)) ?? null;
  } catch {
    /* noop → ไป fallback */
  }

  // Fallback: ใช้ตารางรวม + filter ที่ server
  try {
    const url = new URL(`${API}/minimumspec`);
    url.searchParams.set("game_id", String(gameId));
    const res = await fetch(url.toString(), { credentials: "include" });
    if (!res.ok) return null;
    const raw = await okJson<any>(res);
    const rows = asArray(raw);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/* ---------- utils สำหรับหน้า UI ---------- */

/** หาค่า field ที่อาจสะกดต่างกัน เช่น OS/os */
export function pickSpecField(ms: MinimumSpec | null | undefined, key: "os" | "cpu" | "ram" | "gpu" | "storage", fallback = "N/A") {
  if (!ms) return fallback;
  const v =
    (ms as any)?.[key] ??
    (ms as any)?.[key.toUpperCase()];
  return (v ?? fallback) as string;
}