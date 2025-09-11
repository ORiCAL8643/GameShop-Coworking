// src/pages/OrdersStatusPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Row, Col, Card, Tag, Typography, Space, Button, message, Empty } from "antd";
import { ReloadOutlined, HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8088";

const THEME_PRIMARY = "#9b59b6";
const BG_DARK = "#1e1e2f";
const CARD_DARK = "#171923";
const BORDER = "#2b2f3a";
const TEXT_MAIN = "#e8e8f3";
const TEXT_SUB = "#a9afc3";

type Order = {
  ID?: number; id?: number;
  OrderStatus?: string; order_status?: string;
  TotalAmount?: number; total_amount?: number;
  OrderCreate?: string; order_create?: string;
};

const formatTHB = (n: number | undefined) =>
  `฿${((n ?? 0)).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrdersStatusPage() {
  const { id: userId, token } = useAuth() as { id: number | null; token?: string };
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Order[]>([]);
  const navigate = useNavigate();

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
      // ใช้ mine=1 ก็ได้ หรือจะไม่ใส่ก็ได้เพราะ backend จะบังคับเป็นของตัวเองอยู่ดี
      const res = await fetch(`${API}/orders?mine=1`, { headers: authHeaders });
      if (res.status === 401) {
        throw new Error("Unauthorized");
      }
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
            styles={{ body: { padding: 24 } }}   // ✅ แทน bodyStyle
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
              const total = o.TotalAmount ?? o.total_amount ?? 0;
              const createdRaw = o.OrderCreate ?? o.order_create ?? "";
              const created = createdRaw ? new Date(createdRaw).toLocaleString("th-TH") : "-";

              return (
                <Col key={oid} xs={24} sm={12} md={8} lg={6} xl={6}>
                  <Card
                    hoverable
                    style={{ height: "100%", background: CARD_DARK, borderColor: BORDER, borderRadius: 16 }}
                    styles={{ body: { padding: 16 } }}   // ✅ แทน bodyStyle
                    actions={[
                      <span
                        key="detail"
                        style={{ color: THEME_PRIMARY, fontWeight: 600 }}
                        onClick={() => navigate(`/orders/${oid}`)} // ถ้ายังไม่มีหน้า detail ให้คอมเมนต์ได้
                      >
                        รายละเอียด
                      </span>,
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
    </div>
  );
}
