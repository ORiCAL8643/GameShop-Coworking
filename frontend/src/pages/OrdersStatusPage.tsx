// src/pages/OrdersStatusPage.tsx
import { useEffect, useState } from "react";
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

const formatTHB = (n: number) =>
  `฿${(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrdersStatusPage() {
  const { id } = useAuth();            // ✅ ใช้เฉพาะ id ตามที่คุณต้องการ
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Order[]>([]);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    if (!id) {
      message.warning("กรุณาเข้าสู่ระบบ");
      return;
    }
    setLoading(true);
    try {
      // ✅ กรองเฉพาะคำสั่งซื้อของผู้ใช้ที่ล็อกอินด้วย query user_id
      // (สอดคล้องกับ main.go ที่รองรับ ?user_id= แล้ว)
      const res = await fetch(`${API}/orders?user_id=${id}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      message.error("โหลดสถานะคำสั่งซื้อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ❌ ลบ fetch() ที่อยู่นอก useEffect ออก (เดิมอยู่ใต้ const { id } = useAuth();)
  useEffect(() => {
    setRows([]);     // reset เมื่อเปลี่ยน user
    fetchOrders();
  }, [id]);          // เรียกใหม่เมื่อเปลี่ยนผู้ใช้

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
          <Card style={{ background: CARD_DARK, borderColor: BORDER, borderRadius: 12 }}>
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
              const created = createdRaw ? new Date(createdRaw).toLocaleString() : "-";

              return (
                <Col key={oid} xs={24} sm={12} md={8} lg={6} xl={6}>
                  <Card
                    hoverable
                    style={{ height: "100%", background: CARD_DARK, borderColor: BORDER, borderRadius: 16 }}
                    bodyStyle={{ padding: 16 }}
                    actions={[
                      <span key="detail" style={{ color: THEME_PRIMARY, fontWeight: 600 }}>รายละเอียด</span>,
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
