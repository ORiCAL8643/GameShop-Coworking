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
  status?: string; // optional: "open"|"resolved"|...
  files?: File[];
};

export async function createReport(input: CreateReportInput) {
  const fd = new FormData();
  fd.append("title", input.title);
  fd.append("description", input.description);
  fd.append("user_id", String(input.user_id));
  fd.append("game_id", String(input.game_id));
  if (input.status) fd.append("status", input.status);

  (input.files || []).forEach((f) => {
    fd.append("attachments", f); // backend รองรับชื่อ "attachments" และ "file"
  });

  const { data } = await api.post("/reports", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchReports(): Promise<ProblemReport[]> {
  const { data } = await api.get("/reports");
  type RawReport = {
    ID: number;
    title?: string;
    Title?: string;
    description?: string;
    Description?: string;
    status?: string;
    Status?: string;
    created_at?: string;
    CreatedAt?: string;
    resolved_at?: string;
    ResolvedAt?: string;
    user_id?: number;
    UserID?: number;
    game_id?: number;
    GameID?: number;
    user?: User;
    User?: User;
    game?: Game;
    Game?: Game;
    attachments?: ProblemAttachment[];
    Attachments?: ProblemAttachment[];
  };
  const items: RawReport[] = (data.items ?? data) as RawReport[];
  return items.map((r) => ({
    ID: r.ID,
    title: r.title ?? r.Title ?? "",
    description: r.description ?? r.Description ?? "",
    status: r.status ?? r.Status ?? "",
    created_at: r.created_at ?? r.CreatedAt,
    resolved_at: r.resolved_at ?? r.ResolvedAt,
    user_id: r.user_id ?? r.UserID ?? 0,
    game_id: r.game_id ?? r.GameID ?? 0,
    user: r.user ?? r.User,
    game: r.game ?? r.Game,
    attachments: r.attachments ?? r.Attachments,
  }));
}

export async function resolveReport(id: number) {
  const { data } = await api.put(`/reports/${id}`, { resolve: true });
  return data as ProblemReport;
}
