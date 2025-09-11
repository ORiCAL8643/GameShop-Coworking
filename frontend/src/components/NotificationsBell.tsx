import { useEffect, useMemo, useState } from "react";
import { Badge, Popover, List, Button, Typography, Modal, Divider } from "antd";
import { BellOutlined } from "@ant-design/icons";
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

      // ✅ กรองซ้ำ: เก็บเฉพาะอันล่าสุดต่อ key (type + report_id)
      const map = new Map<string, Notification>();
      for (const n of raw) {
        const key = `${n.type}:${n.report_id ?? n.ID}`;
        const cur = map.get(key);
        if (!cur) {
          map.set(key, n);
        } else {
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
  }, [userId, pollMs]);

  const onOpenChange = async (v: boolean) => {
    setOpen(v);
    if (v) await load();
  };

  const openView = async (n: Notification) => {
    try {
      if (!n.is_read) await markNotificationRead(n.ID);
      setViewNoti(n);
      setViewReport(null);

      if (n.type === "report_reply" && n.report_id) {
        try {
          const rp = await getReportByID(n.report_id);
          setViewReport(rp);
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
    <div style={{ width: 380, maxHeight: 420, overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
        <Text strong>การแจ้งเตือน</Text>
        {items.length > 0 && (
          <Button size="small" onClick={async () => { await markAllNotificationsRead(userId); await load(); }}>
            ทำเป็นอ่านแล้วทั้งหมด
          </Button>
        )}
      </div>

      <List
        dataSource={items}
        locale={{ emptyText: "ยังไม่มีการแจ้งเตือน" }}
        renderItem={(n) => (
          <List.Item
            style={{
              background: n.is_read ? "transparent" : "rgba(146,84,222,0.12)",
              borderRadius: 8,
              marginBottom: 6,
              padding: "10px 12px",
            }}
            actions={[
              <Button size="small" type="link" onClick={() => openView(n)}>ดูข้อความ</Button>,
              !n.is_read ? (
                <Button size="small" type="link" onClick={async () => { await markNotificationRead(n.ID); await load(); }}>
                  อ่านแล้ว
                </Button>
              ) : null,
              <Button size="small" danger type="link" onClick={async () => { await deleteNotification(n.ID); await load(); }}>
                ลบ
              </Button>,
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={<Text strong>{n.title || "แจ้งเตือน"}</Text>}
              description={
                <div>
                  <div style={{ whiteSpace: "pre-line" }}>{n.message}</div>
                  {!!n.created_at && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
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

  // ✅ แสดงเฉพาะไฟล์แนบที่ "แอดมิน" ส่ง (กรอง path ที่อยู่ใต้ /replies/)
  const renderReportAttachments = () => {
    if (!viewReport?.attachments || viewReport.attachments.length === 0) return null;

    const adminOnly = viewReport.attachments.filter((att) => {
      const raw = (att as any).file_path ?? (att as any).FilePath ?? "";
      return /(^|\/)uploads\/replies\//i.test(raw) || raw.toLowerCase().includes("/replies/");
    });

    if (adminOnly.length === 0) return null;

    return (
      <>
        <Text strong>ไฟล์แนบจากแอดมิน:</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
          {adminOnly.map((att) => {
            const rawPath = (att as any).file_path ?? (att as any).FilePath ?? "";
            const url = normalizeUrl(rawPath);
            const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(rawPath);

            return (
              <div key={att.ID} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {isImg ? (
                  <img
                    src={url}
                    alt="attachment"
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 8,
                      cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(0,0,0,.25)",
                    }}
                    onClick={() => { setImgSrc(url); setImgOpen(true); }}
                  />
                ) : (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    📄 {rawPath.split("/").pop()}
                  </a>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, marginTop: 6 }}
                >
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
          <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />
        </Badge>
      </Popover>

      {/* Modal: รายละเอียดแจ้งเตือน */}
      <Modal
  open={viewOpen}
  title={viewNoti?.title || "รายละเอียดแจ้งเตือน"}
  onCancel={() => setViewOpen(false)}
  footer={<Button onClick={() => setViewOpen(false)}>ปิด</Button>}
  destroyOnClose
>
  {/* ❌ ไม่แสดงข้อความสรุปใน noti ถ้าเป็นประเภท report_reply */}
  {viewNoti?.type !== "report_reply" && (
    <Paragraph style={{ whiteSpace: "pre-line", marginBottom: 8 }}>
      {viewNoti?.message}
    </Paragraph>
  )}

  {viewNoti?.type === "report_reply" && viewReport && (
    <>
      {/* ✅ คงเส้นคั่นและส่วนที่เหลือไว้ */}
      <Divider style={{ margin: "10px 0" }} />
      <Text strong>ข้อความตอบกลับจากแอดมิน</Text>
      <Paragraph style={{ whiteSpace: "pre-line" }}>
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
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="preview"
            style={{ width: "100%", height: "auto", borderRadius: 12 }}
          />
        ) : null}
      </Modal>
    </>
  );
}
