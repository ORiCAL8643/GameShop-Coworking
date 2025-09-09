import api from "../lib/api";
import type { Notification, CreateNotificationRequest } from "../interfaces/Notification";
import type { User } from "../interfaces/User";

export async function fetchNotifications(userId: number): Promise<Notification[]> {
  const { data } = await api.get("/notifications", { params: { user_id: userId } });
  type RawNotification = {
    ID: number;
    title?: string;
    Title?: string;
    type?: string;
    Type?: string;
    message?: string;
    Message?: string;
    user_id?: number;
    UserID?: number;
    user?: User;
    User?: User;
    created_at?: string;
    CreatedAt?: string;
    is_read?: boolean;
    IsRead?: boolean;
  };
  const items: RawNotification[] = data as RawNotification[];
  return items.map((n) => ({
    ID: n.ID,
    title: n.title ?? n.Title ?? "",
    type: n.type ?? n.Type ?? "",
    message: n.message ?? n.Message ?? "",
    user_id: n.user_id ?? n.UserID ?? 0,
    user: n.user ?? n.User,
    created_at: n.created_at ?? n.CreatedAt,
    is_read: n.is_read ?? n.IsRead,
  }));
}

export async function createNotification(payload: CreateNotificationRequest): Promise<Notification> {
  const { data } = await api.post("/notifications", payload);
  return data as Notification;
}
