// src/pages/admin/AdminPaymentReviewPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card, Table, Tag, Space, Button, Typography, Modal, Input, Image,
  App, Tooltip, Select, 
} from "antd";
import {
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  ExclamationCircleOutlined, SearchOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const THEME_PRIMARY = "#9b59b6";
const BG_DARK = "#1e1e2f";
const CARD_DARK = "#171923";
const BORDER = "#2b2f3a";
const TEXT_MAIN = "#e8e8f3";
const TEXT_SUB = "#a9afc3";

type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";
type ReviewablePayment = {
  id: number;
  order_no: string;
  user_name: string;
  amount: number;
  slip_url: string;
  uploaded_at: string;
  status: PaymentStatus;
  reject_reason?: string | null;
  order_id: number;
  order_status: string;
};

const formatTHB = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const BASE_URL = "http://localhost:8088";

// ปรับข้อมูลจาก backend ให้เป็นรูปเดียวกัน
function normalizeRow(r: any): ReviewablePayment {
  const statusRaw = (r.status ?? r.Status ?? "PENDING").toString().toUpperCase();
  const orderStatusRaw = (r.order_status ?? r.OrderStatus ?? "").toString().toUpperCase();
  return {
    id: Number(r.id ?? r.ID),
    order_id: Number(r.order_id ?? r.OrderID),
    order_no: r.order_no ?? r.OrderNo ?? `ORD-${String(r.order_id ?? r.OrderID ?? "")}`,
    user_name: r.user_name ?? r.UserName ?? "ไม่ระบุ",
    amount: Number(r.order_total ?? r.OrderTotal ?? r.amount ?? r.Amount ?? 0),
    slip_url: r.slip_url ?? r.SlipURL ?? r.slip_path ?? r.SlipPath ?? "",
    uploaded_at: r.uploaded_at ?? r.UploadedAt ?? r.created_at ?? r.CreatedAt ?? "",
    status: (["PENDING", "APPROVED", "REJECTED"].includes(statusRaw) ? statusRaw : "PENDING") as PaymentStatus,
    reject_reason: r.reject_reason ?? r.RejectReason ?? null,
    order_status: orderStatusRaw || "-",
  };
}

export default function AdminPaymentReviewPage() {
  //const appCtx = App.useApp?.();
  //const message = appCtx?.message ?? antdMessage;
  const { modal, message } = App.useApp();

  const { id: userId, token } = useAuth() as { id: number | null; token?: string };

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (userId) h["X-User-ID"] = String(userId);
    return h;
  }, [token, userId]);

  const [rows, setRows] = useState<ReviewablePayment[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<{ open: boolean; id?: number }>({ open: false });
  const [rejectText, setRejectText] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPayments = async (st: PaymentStatus | "ALL") => {
    setLoading(true);
    try {
      const qs = st === "ALL" ? "" : `?status=${st}`;
      const res = await axios.get(`${BASE_URL}/payments${qs}`, { headers: authHeaders });
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped = data.map(normalizeRow);
      const withTotals = await Promise.all(
        mapped.map(async (r) => {
          try {
            const ord = await axios.get(`${BASE_URL}/orders/${r.order_id}`, { headers: authHeaders });
            const total = Number(ord.data?.total_amount ?? ord.data?.TotalAmount ?? r.amount);
            return { ...r, amount: total };
          } catch {
            return r;
          }
        }),
      );
      setRows(withTotals);
    } catch (e) {
      console.error(e);
      message.error("โหลดข้อมูลการชำระเงินล้มเหลว");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchPayments(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, userId, token]);

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter(
      r => !kw || r.order_no.toLowerCase().includes(kw) || (r.user_name || "").toLowerCase().includes(kw),
    );
  }, [rows, keyword]);

  // ---- อนุมัติ: ใช้ POST /payments/:id/approve (fallback เป็น PATCH ถ้าจำเป็น) ----
  const approve = (id: number) => {
    modal.confirm({
      title: "ยืนยันการชำระเงินถูกต้อง?",
      icon: <ExclamationCircleOutlined />,
      okText: "อนุมัติ",
      cancelText: "ยกเลิก",
      okButtonProps: { style: { background: THEME_PRIMARY, borderColor: THEME_PRIMARY } },
      onOk: async () => {
        try {
          // พยายามยิง /approve ก่อน
          await axios.post(`${BASE_URL}/payments/${id}/approve`, null, { headers: authHeaders });
        } catch (e: any) {
          // ถ้า 404 (โปรเจ็กต์บางอันไม่ผูก /approve) ให้ fallback ไป PATCH
          if (e?.response?.status === 404) {
            await axios.patch(`${BASE_URL}/payments/${id}`, { status: "APPROVED" }, { headers: authHeaders });
          } else {
            throw e;
          }
        }
        // อัปเดตแถวในตารางทันที
        setRows(prev =>
          prev.map(p => (p.id === id ? { ...p, status: "APPROVED", reject_reason: null, order_status: "PAID" } : p)),
        );
        message.success("อนุมัติการชำระเงินแล้ว");
      },
    });
  };

  const reject = (id: number) => {
    setRejectOpen({ open: true, id });
    setRejectText("");
  };

  const submitReject = async () => {
    if (!rejectText.trim()) return message.warning("กรอกเหตุผลที่ปฏิเสธก่อน");
    const id = rejectOpen.id!;
    try {
      await axios.post(
        `${BASE_URL}/payments/${id}/reject`,
        { reject_reason: rejectText.trim() },
        { headers: authHeaders },
      );
      setRows(prev =>
        prev.map(p =>
          p.id === id ? { ...p, status: "REJECTED", reject_reason: rejectText.trim(), order_status: "CANCELLED" } : p,
        ),
      );
      message.success("ปฏิเสธการชำระเงินแล้ว");
      setRejectOpen({ open: false });
    } catch (e) {
      console.error(e);
      message.error("ไม่สามารถปฏิเสธได้");
    }
  };

  return (
    <div style={{ padding: 24, background: BG_DARK, minHeight: "100vh", flex: 1 }}>
      <Typography.Title level={2} style={{ color: THEME_PRIMARY, marginBottom: 16 }}>
        ตรวจสอบการชำระเงิน (แสดงทุกคำสั่งซื้อ)
      </Typography.Title>

      <Card
        style={{ background: CARD_DARK, borderColor: BORDER, borderRadius: 14, marginBottom: 12 }}
        styles={{ body: { padding: 16 } }}
      >
        <Space wrap>
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { value: "ALL", label: "สถานะ: ทั้งหมด" },
              { value: "PENDING", label: "สถานะ: รอตรวจสอบ" },
              { value: "APPROVED", label: "สถานะ: อนุมัติแล้ว" },
              { value: "REJECTED", label: "สถานะ: ปฏิเสธแล้ว" },
            ]}
            style={{ minWidth: 200 }}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 280, background: BG_DARK, color: TEXT_MAIN, borderColor: BORDER }}
          />
          <Button onClick={() => fetchPayments(statusFilter)} loading={loading}>รีเฟรช</Button>
        </Space>
      </Card>

      <Card style={{ background: CARD_DARK, borderColor: BORDER, borderRadius: 14 }}>
        <Table
          rowKey={(r) => String(r.id)}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: "ออเดอร์",
              dataIndex: "order_no",
              render: (v, r) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text style={{ color: "#760ee6ff", fontWeight: 600 }}>{v}</Typography.Text>
                  <Typography.Text style={{ color: "rgba(0, 0, 0, 0.93)", fontSize: 15 }}>
                    โดย {r.user_name || "-"}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "ยอดรวม",
              dataIndex: "amount",
              align: "right" as const,
              render: (n: number) => (
                <Typography.Text style={{ color: "#0acb3eff", fontWeight: 600 }}>
                  {formatTHB(n)}
                </Typography.Text>
              ),
            },
            {
              title: "สลิป",
              dataIndex: "slip_url",
              render: (src: string) =>
                src ? (
                  <Button icon={<EyeOutlined />} onClick={() => setPreviewSrc(src)}>
                    ดูสลิป
                  </Button>
                ) : (
                  <Tag color="default">ไม่มีสลิป</Tag>
                ),
            },
            {
              title: "อัปโหลดเมื่อ",
              dataIndex: "uploaded_at",
              render: (v: string) => <span style={{ color: TEXT_SUB }}>{v || "-"}</span>,
            },
            {
              title: "สถานะชำระเงิน",
              dataIndex: "status",
              render: (s: PaymentStatus, r) =>
                s === "PENDING" ? (
                  <Tag color="gold">รอตรวจสอบ</Tag>
                ) : s === "APPROVED" ? (
                  <Tag color="success">อนุมัติแล้ว</Tag>
                ) : (
                  <Tooltip title={r.reject_reason || ""}>
                    <Tag color="error">ปฏิเสธแล้ว</Tag>
                  </Tooltip>
                ),
            },
            {
              title: "สถานะคำสั่งซื้อ",
              dataIndex: "order_status",
              render: (st: string) => {
                const u = (st || "").toUpperCase();
                const color =
                  u === "PAID" || u === "FULFILLED" ? "success" :
                  u === "UNDER_REVIEW" ? "processing" :
                  u === "CANCELLED" ? "error" : "default";
                return <Tag color={color}>{u || "-"}</Tag>;
              },
            },
            {
              title: "จัดการ",
              key: "action",
              render: (_: unknown, r: ReviewablePayment) => (
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    // หยุด bubbling ป้องกันเคสคลิกแล้ว event ถูกตารางกิน
                    onClick={(e) => { e.stopPropagation(); approve(r.id); }}
                    disabled={r.status !== "PENDING"}
                    style={{ background: THEME_PRIMARY, borderColor: THEME_PRIMARY }}
                  >
                    อนุมัติ
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={(e) => { e.stopPropagation(); reject(r.id); }}
                    disabled={r.status !== "PENDING"}
                  >
                    ปฏิเสธ
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={!!previewSrc}
        onCancel={() => setPreviewSrc(null)}
        footer={null}
        centered
        styles={{ body: { background: CARD_DARK, padding: 12 } }}
        title={<span style={{ color: TEXT_MAIN }}>หลักฐานการชำระเงิน</span>}
      >
        {previewSrc && (
          <Image
            src={previewSrc}
            alt="payment slip"
            style={{ width: "100%", borderRadius: 12, border: `1px solid ${BORDER}` }}
          />
        )}
      </Modal>

      <Modal
        title={<span style={{ color: THEME_PRIMARY }}>ปฏิเสธการชำระเงิน</span>}
        open={rejectOpen.open}
        onCancel={() => setRejectOpen({ open: false })}
        onOk={submitReject}
        okText="ยืนยันปฏิเสธ"
        cancelText="ยกเลิก"
        okButtonProps={{ style: { background: THEME_PRIMARY, borderColor: THEME_PRIMARY } }}
      >
        <Typography.Paragraph style={{ color: TEXT_SUB, marginBottom: 8 }}>
          โปรดระบุเหตุผลที่การชำระเงินไม่ผ่าน
        </Typography.Paragraph>
        <Input.TextArea
          autoSize={{ minRows: 3, maxRows: 6 }}
          value={rejectText}
          onChange={(e) => setRejectText(e.target.value)}
          style={{ background: BG_DARK, color: TEXT_MAIN, borderColor: BORDER }}
        />
      </Modal>
    </div>
  );
}
