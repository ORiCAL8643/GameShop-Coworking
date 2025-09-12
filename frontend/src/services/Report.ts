// src/services/Report.ts
export const API_URL =
  (import.meta as any)?.env?.VITE_API_URL || "http://localhost:8088";

/* ----------------------------- helper ----------------------------- */
/** แปลงผลลัพธ์ + โยน error รูปแบบคล้าย axios => e.response.data */
async function parseResponse(res: Response) {
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    try {
      data = { error: await res.text() };
    } catch {
      data = { error: "Unknown error" };
    }
  }
  if (!res.ok) {
    const err: any = new Error(data?.error || "Request failed");
    err.response = { data };
    throw err;
  }
  return data;
}

/* ----------------------- ผู้ใช้ส่งคำร้อง (Report) ----------------------- */
export async function createReport(payload: {
  title: string;
  description: string;
  category?: string;
  user_id: number; // ใช้ค่านี้เป็น X-User-ID ด้วย
  status?: "open" | "in_progress" | "resolved";
  files?: File[]; // แนบไฟล์เป็น attachments[]
}) {
  const userIdToSend = Number(payload.user_id);

  const fd = new FormData();
  fd.append("title", payload.title);
  fd.append("description", payload.description);
  if (payload.category) fd.append("category", payload.category);
  if (payload.status) fd.append("status", payload.status);
  fd.append("user_id", String(userIdToSend)); // กันพลาด ถ้า backend อ่านจาก form
  if (payload.files?.length) {
    for (const f of payload.files) fd.append("attachments", f);
  }

  const res = await fetch(`${API_URL}/reports`, {
    method: "POST",
    body: fd,
    headers: {
      // backend รองรับ X-User-ID → จะเช็คผู้ใช้จาก header ก่อน
      "X-User-ID": String(userIdToSend),
    },
  });

  // backend คืน { data: report }
  return parseResponse(res);
}

/* ---------------------------- ดึงรายการ ---------------------------- */
/** ดึงลิสต์สถานะ open (ใช้ในหน้า Admin หลัก) */
export async function fetchReports(): Promise<any[]> {
  const res = await fetch(`${API_URL}/reports?status=open&limit=200`);
  const data = await parseResponse(res);
  return Array.isArray(data) ? data : data?.data || [];
}

/** ดึงรายงานตามสถานะ (ใช้ภายใน/ซ้ำได้) */
export async function fetchReportsByStatus(
  status: string,
  limit = 200
): Promise<any[]> {
  const res = await fetch(
    `${API_URL}/reports?status=${encodeURIComponent(status)}&limit=${limit}`
  );
  const data = await parseResponse(res);
  return Array.isArray(data) ? data : data?.data || [];
}

/** ดึงลิสต์สถานะ resolved (หน้า “รายการที่แก้ไขแล้ว”) */
export async function fetchResolvedReports(): Promise<any[]> {
  return fetchReportsByStatus("resolved");
}

/** ดึงรายงานตาม ID (ใช้ตอนเปิดดูจาก Notification) */
export async function getReportByID(id: number): Promise<any> {
  const res = await fetch(`${API_URL}/reports/${id}`);
  const data = await parseResponse(res);
  return data?.data ?? data; // เผื่อ backend คืน {data: ...}
}

/* ----------------------- ตอบกลับ + มาร์คสถานะ ----------------------- */
/** แอดมินตอบกลับ (ข้อความ + ไฟล์แนบ) → backend จะสร้าง noti “ตอบกลับคำร้อง” */
export async function replyReport(
  reportId: number,
  text: string,
  files?: File[]
): Promise<void> {
  const fd = new FormData();
  if (text) fd.append("text", text); // controller ฝั่งคุณรับทั้ง text/message
  if (files?.length) {
    for (const f of files) fd.append("attachments", f);
  }

  // เส้นทางที่มีใน backend (ถูกแมพไปที่ AdminCreateReply)
  const res = await fetch(`${API_URL}/reports/${reportId}/reply`, {
    method: "POST",
    body: fd,
  });
  await parseResponse(res);
}

/** มาร์คว่าแก้ไขแล้ว (ไม่ต้องมี noti “ปิดงานคำร้อง”) */
export async function resolveReport(reportId: number): Promise<any> {
  // ใช้ PUT /reports/:id {"resolve": true} แทน endpoint แอดมิน
  const res = await fetch(`${API_URL}/reports/${reportId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolve: true }),
  });
  return parseResponse(res);
}
