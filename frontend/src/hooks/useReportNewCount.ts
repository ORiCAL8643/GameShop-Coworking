// src/hooks/useReportNewCount.ts
import { useEffect, useRef, useState } from "react";
import { fetchReports } from "../services/Report";
import type { ProblemReport } from "../interfaces/problem_report";

const LS_KEY = "admin_reports_last_seen";

/** โป่งตัวเลข “คำร้องใหม่” (ที่เข้ามาหลังจากครั้งล่าสุดที่แอดมินเห็นหน้า Admin) */
export function useReportNewCount(pollMs = 8000) {
  const [count, setCount] = useState(0);
  const timer = useRef<number | null>(null);

  const load = async () => {
    try {
      const lastSeenStr =
        localStorage.getItem(LS_KEY) || "1970-01-01T00:00:00.000Z";
      const lastSeen = new Date(lastSeenStr).getTime();

      const all: ProblemReport[] = await fetchReports();
      const newOnes = (all || []).filter(
        (r) =>
          r.status !== "resolved" &&
          !!r.created_at &&
          new Date(r.created_at).getTime() > lastSeen
      );

      setCount(newOnes.length);
    } catch {
      // เงียบไว้ไม่กวน UI
    }
  };

  useEffect(() => {
    load(); // ครั้งแรก
    timer.current = window.setInterval(load, pollMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [pollMs]);

  return count;
}

/** เรียกใช้ตอนแอดมิน “เห็นแล้ว” เพื่อตั้ง timestamp ใหม่ */
export function markReportsSeen(latestIso?: string) {
  const iso = latestIso || new Date().toISOString();
  localStorage.setItem(LS_KEY, iso);
}
