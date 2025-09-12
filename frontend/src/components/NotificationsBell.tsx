// src/components/NotificationBell.tsx
import { useEffect, useMemo, useState } from "react";
import { Badge, Popover, List, Button, Typography, Modal, Divider } from "antd";
import { BellOutlined, PaperClipOutlined } from "@ant-design/icons";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/Notification";
import { getReportByID } from "../services/Report";
import type { Notification } from "../interfaces/Notification";
import type { ProblemReport } from "../interfaces/problem_report";

const { Text, Paragraph } = Typography;

type Props = {
  userId: number;
  pollMs?: number;
};

export default function NotificationBell({ userId, pollMs = 5000 }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  // Modal: detail
  const [viewOpen, setViewOpen] = useState(false);
  const [viewNoti, setViewNoti] = useState<Notification | null>(null);
  const [viewReport, setViewReport] = useState<ProblemReport | null>(null);

  // Modal: image preview
  const [imgOpen, setImgOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");

  const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8088") as string;

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const normalizeUrl = (p: string) => {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    const base = API_URL.replace(/\/+$/, "");
    const rel = p.replace(/^\/+/, "");
    return `${base}/${rel}`;
  };

  const load = async () => {
    if (!userId) return;
    try {
      const raw = await fetchNotifications(userId);

      // ✅ กรองซ้ำ: เก็บเฉพาะอันล่าสุดต่อ key (type + report_id|ID)
      const map = new Map<string, Notification>();
      for (const n of raw) {
        const key = `${n.type}:${n.report_id ?? n.ID}`;
        const cur = map.get(key);
        if (!cur) map.set(key, n);
        else {
          const a = (n.created_at || "").toString();
          const b = (cur.created_at || "").toString();
          if (a > b) map.set(key, n);
        }
      }

      const data = Array.from(map.values()).sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      );
      setItems(data);
    } catch (e) {
      console.error("[notifications] fetch error", e);
    }
  };

  useEffect(() => {
    if (!userId) return;
    load();
    const t = setInterval(load, pollMs);
    return () => clearInterval(t);
  }, [userId, pollMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const onOpenChange = async (v: boolean) => {
    setOpen(v);
    if (v) await load();
  };

  const openView = async (n: Notification) => {
    try {
      if (!n.is_read) await markNotificationRead(n.ID);
      setViewNoti(n);
      setViewReport(null);

      // ✅ ถ้าเป็น noti ประเภทตอบกลับ report ดึง "reply ล่าสุด" พร้อมไฟล์แนบ
      if (n.type === "report_reply" && n.report_id) {
        try {
          const rp = await getReportByID(n.report_id);
          const replies = rp.replies || [];
          const latest = replies[replies.length - 1];
          const withLatest = { ...rp, reply: latest?.message };
          setViewReport(withLatest);
        } catch (e) {
          console.warn("load report failed:", e);
        }
      }

      setViewOpen(true);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const content = (
    <div style={{ width: 400, maxHeight: 440, overflow: "auto", color: "#fff" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <Text strong style={{ color: "#b37feb", fontSize: 16 }}>🔔 การแจ้งเตือน</Text>
        {items.length > 0 && (
          <Button
            size="small"
            onClick={async () => { await markAllNotificationsRead(userId); await load(); }}
            style={{
              borderRadius: 8,
              background: "linear-gradient(90deg,#9254de,#ff5ca8)",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              boxShadow: "0 0 12px rgba(146,84,222,.7)",
            }}
          >
            ทำเป็นอ่านแล้วทั้งหมด
          </Button>
        )}
      </div>

      <List
        dataSource={items}
        locale={{ emptyText: <span style={{ color: "#cfc5ff" }}>ยังไม่มีการแจ้งเตือน</span> }}
        renderItem={(n) => (
          <List.Item
            style={{
              background: n.is_read
                ? "rgba(36,18,62,0.85)"
                : "linear-gradient(90deg,#2a0d3d,#3d155f)",
              borderRadius: 12,
              marginBottom: 10,
              padding: "12px 16px",
              boxShadow: "0 0 15px rgba(146,84,222,0.6)",
              border: "1px solid rgba(146,84,222,.35)",
            }}
            actions={[
              <Button
                size="small"
                onClick={() => openView(n)}
                style={{
                  background: "linear-gradient(90deg,#6a11cb,#2575fc)",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: "bold",
                  color: "#fff",
                  boxShadow: "0 0 8px rgba(106,17,203,0.7)",
                }}
              >
                ดูข้อความ
              </Button>,
              !n.is_read ? (
                <Button
                  size="small"
                  onClick={async () => { await markNotificationRead(n.ID); await load(); }}
                  style={{
                    background: "linear-gradient(90deg,#ff5ca8,#9254de)",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: "bold",
                    color: "#fff",
                    boxShadow: "0 0 8px rgba(255,92,168,0.7)",
                  }}
                >
                  อ่านแล้ว
                </Button>
              ) : null,
              <Button
                size="small"
                onClick={async () => { await deleteNotification(n.ID); await load(); }}
                style={{
                  background: "linear-gradient(90deg,#ff4d4f,#a8071a)",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: "bold",
                  color: "#fff",
                  boxShadow: "0 0 8px rgba(255,77,79,0.7)",
                }}
              >
                ลบ
              </Button>,
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={<Text strong style={{ color: "#fff", fontSize: 15 }}>{n.title || "แจ้งเตือน"}</Text>}
              description={
                <div>
                  <div style={{ whiteSpace: "pre-line", color: "#ddd" }}>{n.message}</div>
                  {!!n.created_at && (
                    <Text style={{ fontSize: 12, color: "#aaa" }}>
                      {new Date(n.created_at).toLocaleString()}
                    </Text>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  // ✅ แสดงไฟล์แนบจากการตอบกลับของแอดมิน
  const renderReportAttachments = () => {
    const replies = viewReport?.replies || [];
    const adminOnly = replies.flatMap((r) => r.attachments || []);
    if (adminOnly.length === 0) return null;

    return (
      <>
        <Divider style={{ borderColor: "rgba(146,84,222,.3)", margin: "12px 0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PaperClipOutlined style={{ color: "#b37feb" }} />
          <Text strong style={{ color: "#b37feb" }}>ไฟล์แนบจากแอดมิน</Text>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
          {adminOnly.map((att) => {
            const rawPath = att.file_path ?? att.FilePath ?? "";
            const url = normalizeUrl(rawPath);
            const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(rawPath);
            return (
              <div
                key={att.ID}
                style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                {isImg ? (
                  <img
                    src={url}
                    alt="attachment"
                    style={{
                      width: 130,
                      height: 130,
                      objectFit: "cover",
                      borderRadius: 12,
                      cursor: "pointer",
                      boxShadow: "0 0 12px rgba(146,84,222,.8)",
                    }}
                    onClick={() => {
                      setImgSrc(url);
                      setImgOpen(true);
                    }}
                  />
                ) : (
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#ff85c0" }}>
                    📄 {rawPath.split("/").pop()}
                  </a>
                )}
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, marginTop: 6 }}>
                  เปิดในแท็บใหม่
                </a>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <>
      <Popover placement="bottomRight" trigger="click" content={content} open={open} onOpenChange={onOpenChange}>
        <Badge count={unreadCount} size="small">
          <Button type="text" icon={<BellOutlined style={{ fontSize: 20, color: "#d3d3d3ff" }} />} />
        </Badge>
      </Popover>

      {/* Modal: รายละเอียดแจ้งเตือน */}
      <Modal
        open={viewOpen}
        title={<span style={{ color: "#eae6ff" }}>{viewNoti?.title || "รายละเอียดแจ้งเตือน"}</span>}
        onCancel={() => setViewOpen(false)}
        footer={
          <Button
            onClick={() => setViewOpen(false)}
            style={{
              background: "linear-gradient(90deg,#9254de,#ff5ca8)",
              border: "none",
              color: "#fff",
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: "0 0 12px rgba(146,84,222,.6)",
            }}
          >
            ปิด
          </Button>
        }
        destroyOnClose
        centered
        // ✅ ใช้ styles ของ AntD v5 เพื่อไม่แตะ global CSS
        styles={{
          content: {
            background: "linear-gradient(135deg,#0f0c29,#1b0033)",
            borderRadius: 16,
            border: "1px solid rgba(146,84,222,.45)",
            boxShadow: "0 0 26px rgba(146,84,222,.75)",
            color: "#fff",
          },
          header: {
            background: "transparent",
            borderBottom: "1px solid rgba(146,84,222,.3)",
          },
          body: { background: "transparent", color: "#fff" },
          footer: { background: "transparent", borderTop: "none" },
        }}
      >
        {/* ❌ ไม่แสดงข้อความสรุปใน noti ถ้าเป็นประเภท report_reply */}
        {viewNoti?.type !== "report_reply" && (
          <Paragraph style={{ whiteSpace: "pre-line", marginBottom: 8, color: "#fff" }}>
            {viewNoti?.message}
          </Paragraph>
        )}

        {viewNoti?.type === "report_reply" && viewReport && (
          <>
            <Text strong style={{ color: "#b37feb" }}>ข้อความตอบกลับจากแอดมิน</Text>
            <Paragraph style={{ whiteSpace: "pre-line", color: "#fff" }}>
              {viewReport.reply || "-"}
            </Paragraph>
            {renderReportAttachments()}
          </>
        )}
      </Modal>

      {/* Modal: Preview รูปภาพ */}
      <Modal
        open={imgOpen}
        onCancel={() => setImgOpen(false)}
        footer={null}
        width={920}
        destroyOnClose
        centered
        styles={{
          content: {
            background: "linear-gradient(135deg,#0f0c29,#1b0033)",
            borderRadius: 16,
            border: "1px solid rgba(146,84,222,.45)",
            boxShadow: "0 0 26px rgba(146,84,222,.75)",
          },
          body: { background: "transparent", textAlign: "center" },
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="preview"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 16,
              boxShadow: "0 0 25px rgba(146,84,222,.8)",
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}
