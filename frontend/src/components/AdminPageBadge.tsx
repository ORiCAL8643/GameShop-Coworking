// src/components/AdminPageBadge.tsx
import { useReportNewCount } from "../hooks/useReportNewCount";

export default function AdminPageBadge() {
  // นับจำนวนคำร้องใหม่ ๆ ที่ยังไม่เห็น
  const count = useReportNewCount();

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
