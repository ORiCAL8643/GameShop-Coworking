// src/components/NotificationsBell.tsx
import { useMemo, useState } from "react";
import { Badge, Button, Dropdown, Drawer, List, Space, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import type { Notification } from "../interfaces/Notification";

const { Text, Title } = Typography;

type Props = {
  notifications: Notification[];
  onMarkAllRead?: () => void;                 // เรียก API mark all read ได้ภายหลัง
  onMarkOneRead?: (id: number) => void;       // เรียก API mark one read ได้ภายหลัง
  width?: number;
};

export default function NotificationsBell({
  notifications,
  onMarkAllRead,
  onMarkOneRead,
  width = 420,
}: Props) {
  const [openList, setOpenList] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);

  const unreadCount = useMemo(
    () =>
      notifications.filter((n) =>
        // รองรับทั้งมี/ไม่มี is_read (ถ้าไม่มี ถือว่ายังไม่อ่านทั้งหมด)
        n.is_read === undefined ? true : !n.is_read
      ).length,
    [notifications]
  );

  const menu = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 360,
        maxHeight: 420,
        overflow: "auto",
        background: "#1f1f1f",
        border: "1px solid #303030",
        borderRadius: 10,
        padding: 8,
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingInline: 8 }}>
          <Text style={{ color: "#fff", fontWeight: 600 }}>การแจ้งเตือน</Text>
          <Space size="small">
            <Button size="small" onClick={onMarkAllRead}>อ่านทั้งหมด</Button>
          </Space>
        </div>

        <List
          dataSource={notifications}
          locale={{ emptyText: <Text style={{ color: "#aaa" }}>ไม่มีการแจ้งเตือน</Text> }}
          renderItem={(n) => {
            const unread = n.is_read === undefined ? true : !n.is_read;
            return (
              <List.Item
                onClick={() => {
                  setSelected(n);
                  setDrawerOpen(true);
                  setOpenList(false);
                  onMarkOneRead?.(n.ID);
                }}
                style={{
                  cursor: "pointer",
                  background: unread ? "#2a2340" : "transparent",
                  borderRadius: 8,
                  padding: 10,
                  margin: 4,
                }}
              >
                <List.Item.Meta
                  title={
                    <Text style={{ color: "#fff", fontWeight: 500 }}>
                      {n.title}
                      {unread && <span style={{ color: "#9b59b6", marginLeft: 8 }}>●</span>}
                    </Text>
                  }
                  description={<span style={{ color: "#9aa" }}>{n.created_at ?? ""}</span>}
                />
              </List.Item>
            );
          }}
        />
      </Space>
    </div>
  );

  return (
    <>
      <Dropdown
        open={openList}
        dropdownRender={() => menu}
        placement="bottomRight"
        trigger={["click"]}
        onOpenChange={(o) => setOpenList(o)}
      >
        <Badge count={unreadCount}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 20, color: "#fff" }} />}
            onClick={() => setOpenList((s) => !s)}
          />
        </Badge>
      </Dropdown>

      <Drawer
        open={drawerOpen}
        width={width}
        onClose={() => setDrawerOpen(false)}
        styles={{
          body: { background: "#1e1e2f" },
          header: { background: "#1e1e2f", borderBottom: "1px solid #303030" },
        }}
        title={<Text style={{ color: "#fff" }}>{selected?.title ?? "รายละเอียด"}</Text>}
      >
        {selected ? (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {selected.created_at && (
              <Title level={5} style={{ color: "#ddd", marginTop: 0 }}>
                {selected.created_at}
              </Title>
            )}
            <div style={{ color: "#fff", lineHeight: 1.6 }}>{selected.message}</div>
          </Space>
        ) : (
          <Text style={{ color: "#aaa" }}>ไม่มีรายการ</Text>
        )}
      </Drawer>
    </>
  );
}
