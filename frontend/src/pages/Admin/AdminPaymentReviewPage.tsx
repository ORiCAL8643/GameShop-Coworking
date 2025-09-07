import { useMemo, useState } from "react";
import {
  Card, Table, Tag, Space, Button, Typography, Modal, Input, Image, App, Tooltip, Select
} from "antd";
import {
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ExclamationCircleOutlined, SearchOutlined
} from "@ant-design/icons";

const THEME_PRIMARY = "#9b59b6";
const BG_DARK = "#1e1e2f";
const CARD_DARK = "#171923";
const BORDER = "#2b2f3a";
const TEXT_MAIN = "#110f0fff";   // ขาวชัด
const TEXT_SUB = "#a9afc3";    // เทาอ่อนอ่านง่าย

type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";
type ReviewablePayment = {
  id: string;              // internal payment id
  order_no: string;        // e.g. ORD-20240901-0001
  user_name: string;       // buyer name
  amount: number;          // THB
  slip_url: string;        // image url
  uploaded_at: string;     // ISO / display string
  status: PaymentStatus;
  reject_reason?: string;
};

const formatTHB = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const mockRows: ReviewablePayment[] = [
  {
    id: "p_101",
    order_no: "ORD-2025-0906-0001",
    user_name: "demo_user",
    amount: 1614,
    slip_url: "/assets/slips/sample1.jpg", // เปลี่ยนเป็นของจริงภายหลัง
    uploaded_at: "2025-09-06 09:12",
    status: "PENDING",
  },
  {
    id: "p_102",
    order_no: "ORD-2025-0906-0002",
    user_name: "bright",
    amount: 315,
    slip_url: "/assets/slips/sample2.jpg",
    uploaded_at: "2025-09-06 09:20",
    status: "PENDING",
  },
];

export default function AdminPaymentReviewPage() {
  const { modal, message } = App.useApp();
  const [rows, setRows] = useState<ReviewablePayment[]>(mockRows);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<{ open: boolean; id?: string }>({ open: false });
  const [rejectText, setRejectText] = useState("");

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("PENDING");
  const [keyword, setKeyword] = useState("");

  const data = useMemo(() => {
    return rows.filter(r => {
      const m1 = statusFilter === "ALL" ? true : r.status === statusFilter;
      const kw = keyword.trim().toLowerCase();
      const m2 =
        !kw ||
        r.order_no.toLowerCase().includes(kw) ||
        r.user_name.toLowerCase().includes(kw);
      return m1 && m2;
    });
  }, [rows, statusFilter, keyword]);

  const approve = (id: string) => {
    modal.confirm({
      title: "ยืนยันการชำระเงินถูกต้อง?",
      icon: <ExclamationCircleOutlined />,
      okText: "อนุมัติ",
      cancelText: "ยกเลิก",
      okButtonProps: { style: { background: THEME_PRIMARY, borderColor: THEME_PRIMARY } },
      onOk: async () => {
        // TODO: เรียก API PATCH /payments/:id/approve
        setRows(prev => prev.map(p => (p.id === id ? { ...p, status: "APPROVED" } : p)));
        message.success("อนุมัติการชำระเงินแล้ว");
      },
    });
  };

  const reject = (id: string) => {
    setRejectOpen({ open: true, id });
    setRejectText("");
  };

  const submitReject = async () => {
    if (!rejectText.trim()) return message.warning("กรอกเหตุผลที่ปฏิเสธก่อน");
    const id = rejectOpen.id!;
    // TODO: เรียก API PATCH /payments/:id/reject {reason}
    setRows(prev =>
      prev.map(p => (p.id === id ? { ...p, status: "REJECTED", reject_reason: rejectText.trim() } : p)),
    );
    setRejectOpen({ open: false });
    message.success("ปฏิเสธการชำระเงินแล้ว");
  };

  return (
    <div style={{ padding: 24, background: BG_DARK, minHeight: "100vh", flex: 1 }}>
      <Typography.Title level={2} style={{ color: THEME_PRIMARY, marginBottom: 16 }}>
        ตรวจสอบการชำระเงิน
      </Typography.Title>

      <Card
        style={{ background: CARD_DARK, borderColor: BORDER, borderRadius: 14, marginBottom: 12 }}
        bodyStyle={{ padding: 16 }}
      >
        <Space wrap>
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { value: "PENDING", label: "สถานะ: รอตรวจสอบ" },
              { value: "APPROVED", label: "สถานะ: อนุมัติแล้ว" },
              { value: "REJECTED", label: "สถานะ: ปฏิเสธแล้ว" },
              { value: "ALL", label: "สถานะ: ทั้งหมด" },
            ]}
            style={{ minWidth: 180 }}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="ค้นหาเลขออเดอร์หรือชื่อผู้ใช้"
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              width: 280,
              background: BG_DARK,
              color: TEXT_MAIN,
              borderColor: BORDER,
            }}
          />
        </Space>
      </Card>

      <Card style={{ background: CARD_DARK, borderColor: BORDER, borderRadius: 14 }}>
        <Table
          rowKey="id"
          dataSource={data}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          style={{ color: TEXT_MAIN }}
          columns={[
            {
              title: "ออเดอร์",
              dataIndex: "order_no",
              render: (v, r) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text style={{ color: TEXT_MAIN }}>{v}</Typography.Text>
                  <Typography.Text style={{ color: TEXT_SUB, fontSize: 12 }}>
                    โดย {r.user_name}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "จำนวนเงิน",
              dataIndex: "amount",
              align: "right" as const,
              render: (n: number) => (
                <Typography.Text style={{ color: "#111010ff", fontWeight: 600 }}>
                  {formatTHB(n)}
                </Typography.Text>
              ),
            },
            {
              title: "สลิป",
              dataIndex: "slip_url",
              render: (src: string) => (
                <Button icon={<EyeOutlined />} onClick={() => setPreviewSrc(src)}>
                  ดูสลิป
                </Button>
              ),
            },
            {
              title: "อัปโหลดเมื่อ",
              dataIndex: "uploaded_at",
              render: (v: string) => <span style={{ color: TEXT_SUB }}>{v}</span>,
            },
            {
              title: "สถานะ",
              dataIndex: "status",
              render: (s: PaymentStatus, r) =>
                s === "PENDING" ? (
                  <Tag color="gold">รอตรวจสอบ</Tag>
                ) : s === "APPROVED" ? (
                  <Tag color="success">อนุมัติแล้ว</Tag>
                ) : (
                  <Tooltip title={r.reject_reason}>
                    <Tag color="error">ปฏิเสธแล้ว</Tag>
                  </Tooltip>
                ),
            },
            {
              title: "จัดการ",
              key: "action",
              render: (_: any, r: ReviewablePayment) => (
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => approve(r.id)}
                    disabled={r.status !== "PENDING"}
                    style={{ background: THEME_PRIMARY, borderColor: THEME_PRIMARY }}
                  >
                    อนุมัติ
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => reject(r.id)}
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

      {/* Preview Slip */}
      <Modal
        open={!!previewSrc}
        onCancel={() => setPreviewSrc(null)}
        footer={null}
        centered
        bodyStyle={{ background: CARD_DARK, padding: 12 }}
      >
        {previewSrc && (
          <Image
            src={previewSrc}
            alt="payment slip"
            style={{ borderRadius: 12, border: `1px solid ${BORDER}` }}
          />
        )}
      </Modal>

      {/* Reject Reason */}
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
          placeholder="เช่น จำนวนเงินไม่ถูกต้อง / สลิปซ้ำ / ไม่พบรายการโอน"
          style={{ background: BG_DARK, color: TEXT_MAIN, borderColor: BORDER }}
        />
      </Modal>
    </div>
  );
}
