import api from "../lib/api";
import type { ProblemReport } from "../interfaces/problem_report";
import type { User } from "../interfaces/User";
import type { Game } from "../interfaces/Game";
import type { ProblemAttachment } from "../interfaces/problem_attachment";

export type CreateReportInput = {
  title: string;
  description: string;
  user_id: number | string;
  game_id: number | string;
  status?: string;     // "open" | "resolved" | ...
  files?: File[];
};

/** แปลงผลลัพธ์จาก backend (อาจคละเคส) => รูปแบบเดียวกับ ProblemReport */
function normalizeReport(r: any): ProblemReport {
  return {
    ID: r.ID ?? r.id, // ส่วนมาก gorm จะส่ง "ID"

    title: r.title ?? r.Title ?? "",
    description: r.description ?? r.Description ?? "",
    status: r.status ?? r.Status ?? "",

    created_at: r.created_at ?? r.CreatedAt,
    resolved_at: r.resolved_at ?? r.ResolvedAt,

    user_id: r.user_id ?? r.UserID ?? 0,
    game_id: r.game_id ?? r.GameID ?? 0,

    user: r.user ?? r.User as User | undefined,
    game: r.game ?? r.Game as Game | undefined,

    attachments: r.attachments ?? r.Attachments as ProblemAttachment[] | undefined,
  };
}

export async function createReport(input: CreateReportInput): Promise<ProblemReport> {
  const fd = new FormData();
  fd.append("title", input.title);
  fd.append("description", input.description);
  fd.append("user_id", String(input.user_id));
  fd.append("game_id", String(input.game_id));
  if (input.status) fd.append("status", input.status);

  (input.files || []).forEach((f) => {
    // backend รองรับชื่อ "attachments" (และเผื่อ "file" ด้วย แต่เราใช้อันเดียวพอ)
    fd.append("attachments", f);
  });

  const { data } = await api.post("/reports", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeReport(data);
}

export async function fetchReports(): Promise<ProblemReport[]> {
  const { data } = await api.get("/reports");
  const list = data?.items ?? data ?? [];
  return (list as any[]).map(normalizeReport);
}

export async function resolveReport(id: number): Promise<ProblemReport> {
  const { data } = await api.put(`/reports/${id}`, { resolve: true });
  return normalizeReport(data);
}
