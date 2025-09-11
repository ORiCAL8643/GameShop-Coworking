// src/services/Report.ts
import api from "../lib/api";
import type { ProblemReport } from "../interfaces/problem_report";

export type CreateReportInput = {
  title: string;
  description: string;
  category: string;
  user_id: number; // ✅ snake_case ให้ตรงกับ backend
  game_id: number;
  status?: string;
  files?: File[];
};

// ✅ สร้างรายงาน (multipart/form-data)
export async function createReport(
  input: CreateReportInput,
): Promise<ProblemReport> {
  const fd = new FormData();
  fd.append("title", input.title);
  fd.append("description", input.description);
  fd.append("category", input.category);
  fd.append("user_id", String(input.user_id));
  fd.append("game_id", String(input.game_id));
  fd.append("status", input.status ?? "open");
  (input.files ?? []).forEach((f) => fd.append("attachments", f));

  const { data } = await api.post("/reports", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as ProblemReport;
}

// ✅ ดึงรายการรายงาน
export async function fetchReports(params?: {
  user_id?: number;
  game_id?: number;
  page?: number;
  limit?: number;
}): Promise<ProblemReport[]> {
  const { data } = await api.get("/reports", { params });
  return (Array.isArray(data) ? data : data?.items || []) as ProblemReport[];
}

// ✅ ดึงรายงานตามไอดี
export async function getReportByID(id: number): Promise<ProblemReport> {
  const { data } = await api.get(`/reports/${id}`);
  return data as ProblemReport;
}

// ✅ ตอบกลับรายงาน (Admin reply)
export async function replyReport(
  id: number,
  payload: { admin_id: number; message: string; files?: File[] },
): Promise<ProblemReport> {
  const fd = new FormData();
  fd.append("admin_id", String(payload.admin_id));
  fd.append("message", payload.message);
  (payload.files ?? []).forEach((f) => fd.append("attachments", f));

  const { data } = await api.post(`/reports/${id}/reply`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as ProblemReport;
}

// ✅ Mark resolved
export async function resolveReport(id: number): Promise<ProblemReport> {
  const { data } = await api.put(`/reports/${id}/resolve`);
  return data as ProblemReport;
}

// ✅ ดึงรายการที่แก้ไขแล้ว
export async function fetchResolvedReports(): Promise<ProblemReport[]> {
  const { data } = await api.get("/reports/resolved");
  return (Array.isArray(data) ? data : data?.items || []) as ProblemReport[];
}
