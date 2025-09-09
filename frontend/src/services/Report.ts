import api from "../lib/api";

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
