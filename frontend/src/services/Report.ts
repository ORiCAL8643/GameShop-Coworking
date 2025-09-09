// src/services/report.ts
import api from "../lib/api";

export type CreateReportPayload = {
  title: string;
  description: string;
  user_id: number | string;
  game_id?: number | string;        // ← ออปชัน
  status?: string;
  files?: File[];
};

export async function createReport(payload: CreateReportPayload) {
  const fd = new FormData();
  fd.append("title", payload.title);
  fd.append("description", payload.description);
  fd.append("user_id", String(payload.user_id));
  if (payload.game_id !== undefined && payload.game_id !== null) {
    fd.append("game_id", String(payload.game_id));
  }
  if (payload.status) fd.append("status", payload.status);
  (payload.files || []).forEach((f) => fd.append("attachments", f));

  const { data } = await api.post("/reports", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listReports(params?: {
  user_id?: number;
  game_id?: number;
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get("/reports", { params });
  return data;
}
