import api from "../lib/api";
import type { Notification } from "../interfaces/Notification";
import type { User } from "../interfaces/User";

interface RawNotification {
  ID?: number; id?: number;
  title?: string; Title?: string;
  message?: string; Message?: string;
  type?: string; Type?: string;
  user_id?: number; UserID?: number;
  created_at?: string; CreatedAt?: string;
  is_read?: boolean; IsRead?: boolean;
  report_id?: number; ReportID?: number;
  user?: User; User?: User;
}

export async function fetchNotifications(userId: number): Promise<Notification[]> {
  const { data } = await api.get("/notifications", { params: { user_id: userId } });
  const list = (Array.isArray(data) ? data : data?.items || []) as RawNotification[];
  return list.map((n) => ({
    ID: n.ID ?? n.id ?? 0,
    title: n.title ?? n.Title ?? "",
    message: n.message ?? n.Message ?? "",
    type: n.type ?? n.Type ?? "",
    user_id: n.user_id ?? n.UserID ?? 0,
    created_at: (n.created_at ?? n.CreatedAt ?? "")?.toString(),
    is_read: n.is_read ?? n.IsRead ?? false,
    report_id: n.report_id ?? n.ReportID, // ✅ สำคัญ
  })) as Notification[];
}

export async function createNotification(payload: {
  title: string;
  message: string;
  type: string;
  user_id: number;
  report_id?: number;
}): Promise<Notification | null> {
  try {
    const res = await api.post("/notifications", payload);
    return res.data as Notification;
  } catch (err) {
    console.error("❌ createNotification error:", err);
    return null;
  }
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await api.put(`/notifications/read-all`, { user_id: userId });
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
