import axios from "axios";
import type { Notification } from "../interfaces/Notification";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

// ✅ ดึงแจ้งเตือนของ user
export async function fetchNotifications(userId: number): Promise<Notification[]> {
  try {
    const res = await axios.get(`${API_URL}/notifications`, {
      params: { user_id: userId },
    });
    return res.data;
  } catch (err) {
    console.error("❌ fetchNotifications error:", err);
    return [];
  }
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
    const res = await axios.post(`${API_URL}/notifications`, payload);
    console.log("✅ Notification created:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ createNotification error:", err);
    return null;
  }
}

// ✅ ทำเป็นอ่านแล้วทั้งหมด
export async function markAllNotificationsRead(userId: number): Promise<void> {
  try {
    await axios.put(`${API_URL}/notifications/read-all`, { user_id: userId });
  } catch (err) {
    console.error("❌ markAllNotificationsRead error:", err);
  }
}
