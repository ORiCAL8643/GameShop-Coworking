// src/interfaces/Notification.ts
import type { User } from "./User";

export interface Notification {
  ID: number;
  title: string;
  type: string;   // e.g. "payment", "system"
  message: string;
  user_id: number;
  user?: User;
  created_at?: string;

  is_read?: boolean;
}

export interface CreateNotificationRequest {
  title: string;
  type: string;
  message: string;
  user_id: number;
}

export interface UpdateNotificationRequest {
  ID: number;
  title?: string;
  type?: string;
  message?: string;
}
