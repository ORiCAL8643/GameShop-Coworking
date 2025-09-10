// src/services/Notification.ts
import api from "../lib/api";
import type { Notification } from "../interfaces/Notification";
import type { User } from "../interfaces/User";

// ดึงแจ้งเตือน (ผู้ใช้คนเดียว)
interface RawNotification {
  ID?: number;
  title?: string;
  Title?: string;
  message?: string;
  Message?: string;
  type?: string;
  Type?: string;
  user_id?: number;
  UserID?: number;
  created_at?: string;
  CreatedAt?: string;
  is_read?: boolean;
  IsRead?: boolean;
  user?: User;
  User?: User;
}

export async function fetchNotifications(userId: number): Promise<Notification[]> {
  const { data } = await api.get("/notifications", { params: { user_id: userId } });

  // Some endpoints in the project wrap lists inside an `items` property while
  // others return the array directly.  When the shape wasn't an array the
  // previous implementation treated the response object as an empty list, so no
  // notifications appeared in the bell UI.  Normalise the shape before mapping
  // to our `Notification` type.
  const list = (Array.isArray(data) ? data : data?.items || []) as RawNotification[];

  return list.map((n) => ({
    ID: n.ID ?? 0,
    title: n.title ?? n.Title ?? "",
    message: n.message ?? n.Message ?? "",
    type: n.type ?? n.Type ?? "",
    user_id: n.user_id ?? n.UserID ?? 0,
    created_at: n.created_at ?? n.CreatedAt,
    is_read: n.is_read ?? n.IsRead,
    user: n.user ?? n.User,
  })) as Notification[];
}

// ✅ สร้างแจ้งเตือนใหม่ (ใช้เวลาแอดมินตอบกลับ)
export async function createNotification(payload: {
  title: string;
  message: string;
  type: string; // เช่น "report", "refund"
  user_id: number;
}): Promise<Notification | null> {
  try {
    console.log("🔔 Sending notification:", payload);
    const res = await api.post("/notifications", payload);
    console.log("✅ Notification created:", res.data);
    return res.data as Notification;
  } catch (err) {
    console.error("❌ createNotification error:", err);
    return null;
  }
}

// ทำเป็นอ่านแล้ว (เฉพาะรายการ)
export async function markNotificationRead(id: number): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

// ✅ ทำเป็นอ่านแล้วทั้งหมด
export async function markAllNotificationsRead(userId: number): Promise<void> {
  const list = await fetchNotifications(userId);
  const unread = list.filter((n) => !n.is_read);
  await Promise.all(unread.map((n) => markNotificationRead(n.ID)));
}

// ลบแจ้งเตือน
export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
