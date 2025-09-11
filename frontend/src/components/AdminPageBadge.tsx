// src/components/AdminPageBadge.tsx
import { useEffect, useState } from "react";
import { fetchReports } from "../services/Report";
import type { ProblemReport } from "../interfaces/problem_report";

export default function AdminPageBadge() {
  const [count, setCount] = useState(0);

  const load = async () => {
    try {
      const items: ProblemReport[] = await fetchReports();
      // นับเฉพาะที่ยังไม่ resolved
      const pending = (items || []).filter((r) => r.status !== "resolved")
        .length;
      setCount(pending);
    } catch (e) {
      console.error("[AdminPageBadge] fetchReports error:", e);
    }
  };

  useEffect(() => {
    load(); // ครั้งแรก
    const t = window.setInterval(load, 8000); // โพลล์ทุก 8 วิ
    return () => clearInterval(t);
  }, []);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      Page
      {count > 0 && (
        <span
          style={{
            marginLeft: 6,
            minWidth: 18,
            height: 18,
            padding: "0 6px",
            borderRadius: 9,
            fontSize: 12,
            lineHeight: "18px",
            background: "#ff4d4f",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 2px rgba(255,255,255,0.15)",
          }}
        >
          {count}
        </span>
      )}
    </span>
  );
}