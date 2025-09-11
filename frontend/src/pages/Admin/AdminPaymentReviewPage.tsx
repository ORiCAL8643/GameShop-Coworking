import { useEffect, useMemo, useState } from "react";
import {
  Card, Table, Tag, Space, Button, Typography, Modal, Input, Image, App, Tooltip, Select
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import axios from "axios";

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

export default function AdminPaymentReviewPage() {
  const { modal, message } = App.useApp();
  const [rows, setRows] = useState<ReviewablePayment[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<{ open: boolean; id?: number }>({ open: false });
  const [rejectText, setRejectText] = useState("");

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("PENDING");
  const [keyword, setKeyword] = useState("");

  const fetchPayments = async (st: PaymentStatus | "ALL") => {
    try {
      const qs = st === "ALL" ? "" : `?status=${st}`;
      const res = await axios.get<ReviewablePayment[]>(`${BASE_URL}/payments${qs}`);
      setRows(res.data);
    } catch {
      message.error("โหลดข้อมูลการชำระเงินล้มเหลว");
    }
  };

  useEffect(() => {
    fetchPayments(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const data = useMemo(() => {
    return rows.filter(r => {
      const kw = keyword.trim().toLowerCase();
      return (
        !kw ||
        r.order_no.toLowerCase().includes(kw) ||
        (r.user_name || "").toLowerCase().includes(kw)
      );
    });
  }, [rows, keyword]);

  const updateStatus = async (id: number, data: { status: PaymentStatus; reject_reason?: string }) => {
    await axios.patch(`${BASE_URL}/payments/${id}`, data);
    await fetchPayments(statusFilter);
  };

  const approve = (id: number) => {
    modal.confirm({
      title: "ยืนยันการชำระเงินถูกต้อง?",
      icon: <ExclamationCircleOutlined />,
      okText: "อนุมัติ",
      cancelText: "ยกเลิก",
      okButtonProps: { style: { background: THEME_PRIMARY, borderColor: THEME_PRIMARY } },
      onOk: async () => {
        try {
          await updateStatus(id, { status: "APPROVED" });
          message.success("อนุมัติการชำระเงินแล้ว");
        } catch {
          message.error("ไม่สามารถอนุมัติได้");
        }
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
      await updateStatus(id, {
        status: "REJECTED",
        reject_reason: rejectText.trim(),
      });
      message.success("ปฏิเสธการชำระเงินแล้ว");
      setRejectOpen({ open: false });
    } catch {
      message.error("ไม่สามารถปฏิเสธได้");
    }
  };

  const markPending = (id: number) => {
    modal.confirm({
      title: "เปลี่ยนสถานะกลับเป็นรอตรวจสอบ?",
      icon: <ExclamationCircleOutlined />,
      okText: "ยืนยัน",
      cancelText: "ยกเลิก",
      okButtonProps: { style: { background: THEME_PRIMARY, borderColor: THEME_PRIMARY } },
      onOk: async () => {
        try {
          await updateStatus(id, { status: "PENDING" });
          message.success("เปลี่ยนเป็นรอตรวจสอบแล้ว");
        } catch {
          message.error("ไม่สามารถเปลี่ยนสถานะได้");
        }
      },
    });
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
          <Button onClick={() => fetchPayments(statusFilter)}>รีเฟรช</Button>
        </Space>
      </Card>

      <Card style={{ background: CARD_DARK, borderColor: BORDER, borderRadius: 14 }}>
        <Table
          rowKey="id"
          dataSource={data}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: "ออเดอร์",
              dataIndex: "order_no",
              render: (v, r) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text style={{ color: TEXT_MAIN }}>{v}</Typography.Text>
                  <Typography.Text style={{ color: TEXT_SUB, fontSize: 12 }}>
                    โดย {r.user_name || "-"}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "จำนวนเงิน",
              dataIndex: "amount",
              align: "right" as const,
              render: (n: number) => (
                <Typography.Text style={{ color: "#fff", fontWeight: 600 }}>
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
              render: (s: PaymentStatus | string | undefined, r) =>
                s === "PENDING" ? (
                  <Tag color="gold">รอตรวจสอบ</Tag>
                ) : s === "APPROVED" ? (
                  <Tag color="success">อนุมัติแล้ว</Tag>
                ) : s === "REJECTED" ? (
                  <Tooltip title={r.reject_reason}>
                    <Tag color="error">ปฏิเสธแล้ว</Tag>
                  </Tooltip>
                ) : (
                  <Tag color="default">ไม่ทราบ</Tag>
                ),
            },
            {
              title: "จัดการ",
              key: "action",
              render: (_: unknown, r: ReviewablePayment) => (
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
                  {r.status !== "PENDING" && (
                    <Button icon={<UndoOutlined />} onClick={() => markPending(r.id)}>
                      ตั้งเป็นรอตรวจสอบ
                    </Button>
                  )}
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
