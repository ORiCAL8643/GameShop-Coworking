// src/services/Notification.ts
import api from "../lib/api";
import type { Notification, CreateNotificationRequest } from "../interfaces/Notification";
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
  const list = data as RawNotification[];
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

// สร้างแจ้งเตือน (แอดมินเรียกเวลา “Send Reply”)
export async function createNotification(payload: CreateNotificationRequest): Promise<Notification> {
  const { data } = await api.post("/notifications", payload);
  return data as Notification;
}

// ทำเป็นอ่านแล้ว
export async function markNotificationRead(id: number): Promise<Notification> {
  const { data } = await api.put(`/notifications/${id}`, { is_read: true });
  return data as Notification;
}

// ทำเป็นอ่านแล้วทั้งหมดของ user (ไล่ทีละตัว)
export async function markAllNotificationsRead(userId: number): Promise<void> {
  const list = await fetchNotifications(userId);
  const unread = list.filter((n) => !n.is_read);
  await Promise.all(unread.map((n) => markNotificationRead(n.ID)));
}

// ลบแจ้งเตือน
export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
