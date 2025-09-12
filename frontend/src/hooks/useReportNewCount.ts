// src/hooks/useReportNewCount.ts
import { useEffect, useState } from "react";
import { API_URL } from "../services/Report";

const LS_KEY = "reports_seen_at";

// เวลาเห็นล่าสุด (ISO string)
export function getReportsSeenAt(): string {
  return localStorage.getItem(LS_KEY) || "";
}

export function markReportsSeen(iso?: string) {
  const v = iso ?? new Date().toISOString();
  localStorage.setItem(LS_KEY, v);
  window.dispatchEvent(new CustomEvent("report:lastSeenChanged", { detail: v }));
}

// ช่วย parse created_at/CreatedAt ให้เป็น ms
function parseCreatedAtMs(r: any): number {
  const v = r?.created_at ?? r?.CreatedAt ?? r?.createdAt;
  if (!v) return 0;

  // รองรับ string, number, หรือ object จาก GORM (มี .Time)
  if (typeof v === "string") {
    const ms = Date.parse(v);
    return isNaN(ms) ? 0 : ms;
  }
  if (typeof v === "number") return v;
  if (v?.Time) {
    const ms = Date.parse(v.Time);
    return isNaN(ms) ? 0 : ms;
  }
  const ms = Date.parse(String(v));
  return isNaN(ms) ? 0 : ms;
}

// ดึง open reports ทั้งหมด
async function fetchOpenReports(): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/reports?status=open&limit=200`);
    const data = await res.json().catch(() => null);
    const list = Array.isArray(data) ? data : data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("[useReportNewCount] fetchOpenReports error:", e);
    return [];
  }
}

/**
 * นับจำนวนเคสใหม่ (created_at/CreatedAt > lastSeen)
 * - poll ทุก pollMs ms
 * - refresh เมื่อมี event "admin:report:new" หรือ "report:lastSeenChanged"
 */
export function useReportNewCount(pollMs = 8000): number {
  const [count, setCount] = useState(0);

  const refresh = async () => {
    try {
      const lastSeen = getReportsSeenAt();
      const lastSeenMs = lastSeen ? Date.parse(lastSeen) : 0;

      const items = await fetchOpenReports();

      const newCount = items.filter((r) => {
        const t = parseCreatedAtMs(r);
        return lastSeenMs ? t > lastSeenMs : true;
      }).length;

      setCount(newCount);
    } catch (e) {
      console.error("[useReportNewCount] refresh error:", e);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, pollMs);

    const onBump = () => refresh();
    window.addEventListener("admin:report:new", onBump as any);
    window.addEventListener("report:lastSeenChanged", onBump as any);

    return () => {
      clearInterval(t);
      window.removeEventListener("admin:report:new", onBump as any);
      window.removeEventListener("report:lastSeenChanged", onBump as any);
    };
  }, [pollMs]);

  return count;
}
