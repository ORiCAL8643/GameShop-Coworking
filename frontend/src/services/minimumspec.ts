// PATH: src/services/minimumspec.ts
const API_URL = "http://localhost:8088";

export interface MinimumSpec {
  ID?: number; id?: number;
  game_id?: number; gameId?: number; GameID?: number;
  os?: string; OS?: string;
  cpu?: string; CPU?: string;
  ram?: string; RAM?: string;
  gpu?: string; GPU?: string;
  storage?: string; Storage?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "API request failed");
  }
  const txt = await res.text();
  return (txt ? JSON.parse(txt) : (null as any)) as T;
}

const toArray = (v: any): any[] =>
  Array.isArray(v) ? v
  : Array.isArray(v?.items) ? v.items
  : Array.isArray(v?.data) ? v.data
  : Array.isArray(v?.rows) ? v.rows
  : Array.isArray(v?.specs) ? v.specs
  : [];

const toNum = (v: any): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

function addAliases<T extends Record<string, any>>(row: T) {
  const id = toNum(row?.id ?? row?.ID ?? row?.Id);
  const game_id = toNum(row?.game_id ?? row?.gameId ?? row?.GameID);
  return {
    ...row,
    id: id ?? (row as any).id,
    ID: id ?? (row as any).ID,
    game_id: game_id ?? (row as any).game_id,
    gameId: game_id ?? (row as any).gameId,
    GameID: game_id ?? (row as any).GameID,
  };
}

// ---------------- APIs ----------------

/** คืนรายการ MinimumSpec ทั้งหมด (ทนรูปแบบ payload หลายแบบ) */
export async function listMinimumSpecs(): Promise<MinimumSpec[]> {
  const res = await fetch(`${API_URL}/minimumspec`, { credentials: "include" });
  const raw = await handleResponse<any>(res);
  return toArray(raw).map((r) => addAliases<MinimumSpec>(r));
}

/** หา MinimumSpec ตาม id (ถ้าไม่มีจะคืน null) */
export async function getMinimumSpecById(id: number): Promise<MinimumSpec | null> {
  const all = await listMinimumSpecs();
  return all.find((s: any) => (s?.ID ?? s?.id) === id) ?? null;
}

/** หา MinimumSpec ของเกม: ใช้ minimum_spec_id ก่อน; ถ้าไม่เจอค่อยหาแบบ game_id */
export async function findMinimumSpecForGame(game: any): Promise<MinimumSpec | null> {
  const specs = await listMinimumSpecs();

  const msId = Number(game?.minimum_spec_id ?? game?.minimumSpecId ?? game?.MinimumSpecID);
  if (Number.isFinite(msId)) {
    const byId = specs.find((s: any) => (s?.ID ?? s?.id) === msId);
    if (byId) return byId;
  }

  const gid = Number(game?.ID ?? game?.id);
  if (Number.isFinite(gid)) {
    const byGame = specs.find((s: any) => Number(s?.game_id ?? s?.gameId ?? s?.GameID) === gid);
    if (byGame) return byGame;
  }

  return null;
}
