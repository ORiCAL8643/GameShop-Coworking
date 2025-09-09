// src/components/NotificationBell.tsx
import { useEffect, useMemo, useState } from "react";
import { Badge, Popover, List, Button, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { fetchNotifications, markAllNotificationsRead } from "../services/Notification";
import type { Notification } from "../interfaces/Notification";

const { Text } = Typography;

type Props = {
  userId: number;          // ใส่ user id ที่ล็อกอินอยู่
  pollMs?: number;         // ค่า default 5000ms
};

export default function NotificationBell({ userId, pollMs = 5000 }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const load = async () => {
    try {
      const data = await fetchNotifications(userId);
      // เรียงล่าสุดก่อน
      data.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      setItems(data);
    } catch (e) {
      // เงียบไว้ไม่ให้เด้ง error บ่อย
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
    if (v && unreadCount > 0) {
      await markAllNotificationsRead(userId);
      // โหลดใหม่เพื่ออัปเดต badge = 0
      await load();
    }
  };

  const content = (
    <div style={{ width: 360, maxHeight: 380, overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <Text strong>การแจ้งเตือน</Text>
        <Button size="small" onClick={async () => { await markAllNotificationsRead(userId); await load(); }}>
          ทำเป็นอ่านแล้วทั้งหมด
        </Button>
      </div>
      <List
        dataSource={items}
        locale={{ emptyText: "ยังไม่มีการแจ้งเตือน" }}
        renderItem={(n) => (
          <List.Item style={{ background: n.is_read ? "transparent" : "rgba(146,84,222,0.12)", borderRadius: 8, marginBottom: 6, padding: "10px 12px" }}>
            <List.Item.Meta
              title={<Text strong>{n.title || "แจ้งเตือน"}</Text>}
              description={
                <div>
                  <div>{n.message}</div>
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

  return (
    <Popover
      placement="bottomRight"
      trigger="click"
      content={content}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Badge count={unreadCount} size="small">
        <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />
      </Badge>
    </Popover>
  );
}
