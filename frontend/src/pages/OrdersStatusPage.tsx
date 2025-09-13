// src/pages/OrdersStatusPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Row, Col, Card, Tag, Typography, Space, Button, message, Empty,
  Tooltip, Drawer, List, Modal, Input, Divider, App, Alert
} from "antd";
import {
  ReloadOutlined, HomeOutlined, ArrowLeftOutlined,
  EyeOutlined, EyeInvisibleOutlined, KeyOutlined, CopyOutlined, ExclamationCircleOutlined
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8088";

const THEME_PRIMARY = "#9b59b6";
const BG_DARK = "#1e1e2f";
const CARD_DARK = "#171923";
const BORDER = "#2b2f3a";
const TEXT_MAIN = "#e8e8f3";
const TEXT_SUB = "#a9afc3";

type OrderItemRow = {
  unit_price?: number; UnitPrice?: number;
  qty?: number; QTY?: number;
  line_total?: number; LineTotal?: number;
};

type Order = {
  ID?: number; id?: number;
  OrderStatus?: string; order_status?: string;
  TotalAmount?: number; total_amount?: number;
  OrderCreate?: string; order_create?: string;
  OrderItems?: OrderItemRow[]; order_items?: OrderItemRow[];
};

type RawKeyRow = any;

type KeyRow = {
  id: number | string;
  gameName: string;
  code?: string | null;       // อาจว่างจนกว่าจะกด "แสดงคีย์"
  revealed: boolean;
};

const formatTHB = (n: number | undefined) =>
  `฿${((n ?? 0)).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const maskCode = (s?: string | null) => {
  // หน้ากากคีย์เกมแบบอ่านง่าย “••••-••••-••••-••••”
  const base = "••••-••••-••••-••••";
  if (!s) return base;
  // ถ้าโค้ดยาวกว่า 4*4 ให้ดูความยาวแล้วสร้างจุดเท่าจำนวนกลุ่ม
  const groups = Math.max(4, Math.ceil(s.replace(/-/g, "").length / 4));
  return Array.from({ length: groups }).map(() => "••••").join("-");
};

export default function OrdersStatusPage() {
  const { id: userId, token } = useAuth() as { id: number | null; token?: string };
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Order[]>([]);
  const navigate = useNavigate();
  const { modal } = App.useApp?.() ?? { modal: Modal };

  // ✅ รวม header ยืนยันตัวตน (รองรับทั้ง JWT และ X-User-ID)
  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (userId) h["X-User-ID"] = String(userId);
    return h;
  }, [token, userId]);

  const fetchOrders = async () => {
    if (!userId) {
      message.warning("กรุณาเข้าสู่ระบบ");
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/orders?mine=1`, { headers: authHeaders });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      message.error("โหลดสถานะคำสั่งซื้อไม่สำเร็จ");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRows([]);
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  const colorOf = (st: string) => {
    switch ((st || "").toUpperCase()) {
      case "WAITING_PAYMENT": return "default";
      case "UNDER_REVIEW":   return "processing";
      case "PAID":           return "success";
      case "FULFILLED":      return "success";
      case "CANCELLED":      return "error";
      default:               return "default";
    }
  };

  // ---------- คีย์เกม ----------
  const [keysOpenFor, setKeysOpenFor] = useState<number | null>(null);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysByOrder, setKeysByOrder] = useState<Record<number, KeyRow[]>>({});

  const normalizeKeys = (raw: RawKeyRow[]): KeyRow[] => {
    // ยืดหยุ่นเรื่องชื่อฟิลด์จาก backend ต่างเวอร์ชัน
    const pick = <T,>(obj: any, names: string[], fallback?: T): T | undefined => {
      for (const n of names) {
        if (obj[n] !== undefined) return obj[n];
      }
      return fallback;
    };
    return (raw || []).map((r: any, i: number) => {
      const id = pick<number | string>(r, ["id", "ID", "key_id", "KeyID"], i);
      const gameName =
        pick<string>(r, ["game_name", "GameName", "title", "Title"], "Unknown Game") as string;
      const code = pick<string | null>(r, ["key_code", "KeyCode", "code", "Code"], null) ?? null;
      const revealed = !!pick<boolean>(r, ["is_revealed", "revealed", "IsRevealed"], !!code);
      return { id: id!, gameName, code, revealed };
    });
  };

  const openKeys = async (orderId: number) => {
    setKeysOpenFor(orderId);
    if (keysByOrder[orderId]) return; // มี cache แล้ว แสดงได้ทันที
    setKeysLoading(true);
    try {
      const res = await fetch(`${API}/orders/${orderId}/keys`, { headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setKeysByOrder((prev) => ({ ...prev, [orderId]: normalizeKeys(Array.isArray(data) ? data : []) }));
    } catch (err) {
      console.error(err);
      message.error("โหลดคีย์เกมไม่สำเร็จ");
    } finally {
      setKeysLoading(false);
    }
  };

  const revealKey = (orderId: number, keyId: number | string) => {
    modal.confirm({
      title: "ยืนยันการแสดงคีย์เกม",
      icon: <ExclamationCircleOutlined />,
      content: "เมื่อแสดงคีย์เกมแล้ว คุณจะไม่สามารถขอคืนเงินสำหรับคำสั่งซื้อนี้ได้",
      okText: "แสดงคีย์",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true, style: { background: THEME_PRIMARY, borderColor: THEME_PRIMARY } },
      async onOk() {
        try {
          const res = await fetch(`${API}/orders/${orderId}/keys/${keyId}/reveal`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: "{}",
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          const code: string =
            data?.code ?? data?.Code ?? data?.key_code ?? data?.KeyCode ?? "";
          if (!code) throw new Error("ไม่พบคีย์เกมในคำตอบจากเซิร์ฟเวอร์");

          setKeysByOrder((prev) => {
            const list = prev[orderId]?.map((k) =>
              String(k.id) === String(keyId) ? { ...k, code, revealed: true } : k
            ) ?? [];
            return { ...prev, [orderId]: list };
          });
          message.success("แสดงคีย์เกมแล้ว");
        } catch (err) {
          console.error(err);
          message.error("ไม่สามารถแสดงคีย์เกมได้");
        }
      },
    });
  };

  const copyKey = async (code?: string | null) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      message.success("คัดลอกคีย์แล้ว");
    } catch {
      message.warning("คัดลอกไม่สำเร็จ");
    }
  };

  const statusAllowsView = (st: string) => {
    const S = (st || "").toUpperCase();
    return S === "PAID" || S === "FULFILLED";
    // ถ้าอนาคตอยากเปิดเฉพาะ FULFILLED ก็เหลือ S === "FULFILLED"
  };

  return (
    <div style={{ background: BG_DARK, minHeight: "calc(100vh - 64px)", width: "100%", padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "0 auto 16px",
          maxWidth: 1280,
          width: "100%",
        }}
      >
        <Typography.Title level={2} style={{ color: THEME_PRIMARY, margin: 0 }}>
          สถานะคำสั่งซื้อของฉัน
        </Typography.Title>

        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>ย้อนกลับ</Button>
          <Button icon={<HomeOutlined />} onClick={() => navigate("/home")}>กลับหน้าหลัก</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>รีเฟรช</Button>
        </Space>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {rows.length === 0 ? (
          <Card
            style={{ background: CARD_DARK, borderColor: BORDER, borderRadius: 12 }}
            styles={{ body: { padding: 24 } }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: TEXT_SUB }}>ยังไม่มีคำสั่งซื้อ</span>}
            />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {rows.map((o) => {
              const oid = o.ID ?? o.id!;
              const status = (o.OrderStatus ?? o.order_status ?? "").toUpperCase();
              const items = (o.OrderItems ?? o.order_items ?? []) as any[];
              const total =
                o.TotalAmount ??
                o.total_amount ??
                items.reduce(
                  (sum, it) =>
                    sum +
                    (it.LineTotal ??
                      it.line_total ??
                      (it.UnitPrice ?? it.unit_price ?? 0) * (it.QTY ?? it.qty ?? 1)),
                  0,
                );

              const createdRaw = o.OrderCreate ?? o.order_create ?? "";
              const created = createdRaw ? new Date(createdRaw).toLocaleString("th-TH") : "-";
              const canViewKeys = statusAllowsView(status);

              return (
                <Col key={oid} xs={24} sm={12} md={8} lg={6} xl={6}>
                  <Card
                    hoverable
                    style={{ height: "100%", background: CARD_DARK, borderColor: BORDER, borderRadius: 16 }}
                    styles={{ body: { padding: 16 } }}
                    actions={[
                      <span
                        key="detail"
                        style={{ color: THEME_PRIMARY, fontWeight: 600 }}
                        onClick={() => navigate(`/orders/${oid}`)}
                      >
                        ดูข้อมูลเกม
                      </span>,
                      <Tooltip
                        key="viewkeys"
                        title={canViewKeys ? "ดูคีย์เกม" : "ต้องรออนุมัติการชำระเงินก่อน"}
                      >
                        <span
                          onClick={() => canViewKeys ? openKeys(oid) : null}
                          style={{
                            color: canViewKeys ? TEXT_MAIN : TEXT_SUB,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: canViewKeys ? "pointer" : "not-allowed",
                            opacity: canViewKeys ? 1 : 0.6,
                          }}
                        >
                          <KeyOutlined /> ดูคีย์เกม
                        </span>
                      </Tooltip>,
                    ]}
                  >
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Typography.Text style={{ color: TEXT_MAIN, fontWeight: 600 }}>
                          Order #{oid}
                        </Typography.Text>
                        <Tag color={colorOf(status)}>{status || "UNKNOWN"}</Tag>
                      </Space>

                      <div>
                        <Typography.Text style={{ color: TEXT_SUB }}>สร้างเมื่อ</Typography.Text>
                        <div style={{ color: TEXT_MAIN }}>{created}</div>
                      </div>

                      <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 8 }}>
                        <Typography.Text style={{ color: TEXT_SUB }}>ยอดรวม</Typography.Text>
                        <Typography.Title level={3} style={{ margin: 0, color: "#fff" }}>
                          {formatTHB(total)}
                        </Typography.Title>
                      </div>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Drawer: คีย์เกม */}
      <Drawer
        open={!!keysOpenFor}
        onClose={() => setKeysOpenFor(null)}
        title={<span style={{ color: TEXT_MAIN }}>คีย์เกมของคำสั่งซื้อ #{keysOpenFor ?? "-"}</span>}
        width={560}
        styles={{
          header: { background: CARD_DARK, borderBottom: `1px solid ${BORDER}` },
          body: { background: CARD_DARK },
          footer: { background: CARD_DARK, borderTop: `1px solid ${BORDER}` },
        }}
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Alert
              type="warning"
              showIcon
              message="ข้อควรระวัง"
              description="เมื่อกด ‘แสดงคีย์’ สำหรับรายการใดแล้ว จะถือว่าคุณได้เปิดดูคีย์เกม และจะไม่สามารถขอคืนเงินได้สำหรับคำสั่งซื้อนี้"
              style={{ background: "#f9f8f9ff", borderColor: BORDER, color: TEXT_MAIN }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setKeysOpenFor(null)}>ปิด</Button>
            </div>
          </div>
        }
      >
        <div style={{ color: TEXT_SUB, marginBottom: 16, fontSize: 18, lineHeight: 1.6 }}>
          กด <strong style={{ color: THEME_PRIMARY }}>แสดงคีย์</strong> เพื่อดูคีย์จริง และสามารถ{" "}
          <strong style={{ color: THEME_PRIMARY }}>คัดลอก</strong> ไปใช้งานได้
        </div>

        <Card
          style={{ background: "#14161d", borderColor: BORDER, borderRadius: 12 }}
          styles={{ body: { padding: 0 } }}
          bordered
        >
          <List
            loading={keysLoading}
            dataSource={keysOpenFor ? (keysByOrder[keysOpenFor] ?? []) : []}
            locale={{ emptyText: <span style={{ color: TEXT_SUB }}>ไม่พบคีย์เกมในคำสั่งซื้อนี้</span> }}
            renderItem={(item) => {
              const isRevealed = !!item.revealed && !!item.code;
              return (
                <>
                  <List.Item
                    style={{
                      padding: 16,
                      borderBottom: `1px solid ${BORDER}`,
                      alignItems: "stretch",
                      background: "#14161d",
                    }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }} size={8}>
                      <Space style={{ justifyContent: "space-between", width: "100%" }}>
                        <Typography.Text style={{ color: TEXT_MAIN, fontWeight: 600 }}>
                          {item.gameName}
                        </Typography.Text>
                        <Tag color={isRevealed ? "success" : "default"}>
                          {isRevealed ? "OPENED" : "HIDDEN"}
                        </Tag>
                      </Space>

                      {/* แถบคีย์เกม */}
                      <Input
                        readOnly
                        value={isRevealed ? item.code ?? "" : maskCode(item.code)}
                        style={{
                          background: "#0f1117",
                          borderColor: BORDER,
                          color: isRevealed ? "#fff" : TEXT_SUB,
                          fontWeight: 600,
                          letterSpacing: 1.2,
                        }}
                        suffix={
                          <Space>
                            {isRevealed ? (
                              <Tooltip title="ซ่อนคีย์ (เฉพาะหน้าจอนี้)">
                                <EyeInvisibleOutlined style={{ color: TEXT_SUB }} />
                              </Tooltip>
                            ) : (
                              <Tooltip title="แสดงคีย์ (ยกเลิกการคืนเงิน)">
                                <Button
                                  size="small"
                                  type="primary"
                                  style={{ background: THEME_PRIMARY, borderColor: THEME_PRIMARY }}
                                  icon={<EyeOutlined />}
                                  onClick={() => keysOpenFor && revealKey(keysOpenFor, item.id)}
                                >
                                  แสดงคีย์
                                </Button>
                              </Tooltip>
                            )}

                            <Tooltip title={isRevealed ? "คัดลอกคีย์" : "ต้องแสดงคีย์ก่อนคัดลอก"}>
                              <Button
                                size="small"
                                disabled={!isRevealed}
                                icon={<CopyOutlined />}
                                onClick={() => copyKey(item.code)}
                              >
                                คัดลอก
                              </Button>
                            </Tooltip>
                          </Space>
                        }
                      />
                    </Space>
                  </List.Item>
                </>
              );
            }}
          />
        </Card>

        <Divider style={{ borderColor: BORDER }} />
        <div style={{ color: TEXT_SUB, fontSize: 17, lineHeight: 1.6 }}>
          <ExclamationCircleOutlined style={{ color: THEME_PRIMARY, marginRight: 6 }} />
          โปรดเก็บรักษาคีย์เกมไว้เป็นความลับ ห้ามเผยแพร่สู่สาธารณะ
        </div>
      </Drawer>
    </div>
  );
}
