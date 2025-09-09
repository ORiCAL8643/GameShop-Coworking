import api from "../lib/api";
import type { Notification, CreateNotificationRequest } from "../interfaces/Notification";

export async function fetchNotifications(userId: number): Promise<Notification[]> {
  const { data } = await api.get("/notifications", { params: { user_id: userId } });
  return data as Notification[];
}

export async function createNotification(payload: CreateNotificationRequest): Promise<Notification> {
  const { data } = await api.post("/notifications", payload);
  return data as Notification;
}
