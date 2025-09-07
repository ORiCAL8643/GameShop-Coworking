// src/pages/PaymentPage.tsx
import { useMemo, useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Divider,
  Modal,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useParams, useSearchParams } from "react-router-dom";

// ✅ โทนเดียวกับหน้าอื่น
const THEME_PRIMARY = "#9b59b6";
const BG_DARK = "#1e1e2f";
const CARD_DARK = "#171923";
const BORDER = "#2b2f3a";
const TEXT_MAIN = "#e8e8f3";
const TEXT_SUB = "#a9afc3";

// ⬇️ นำรูปไปไว้ที่ src/assets/ktb-qr.png
import qrPromptPay from "../assets/ktb-qr.png";

interface CartItem {
  id: string;
  title: string;
  price: number; // THB
  note?: string;
}

const formatTHB = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PaymentPage = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<any | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const orderIdParam =
    id ||
    searchParams.get("id") ||
    searchParams.get("order_id") ||
    localStorage.getItem("orderId");

  useEffect(() => {
    if (!orderIdParam) return;
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:8088/orders/${orderIdParam}`);
        if (!res.ok) throw new Error("fetch order failed");
        const data = await res.json();
        setOrder(data);
        const mapped: CartItem[] =
          data.order_items?.map((it: any) => ({
            id: String(it.id),
            title: it.key_game?.game?.game_name || `Game ${it.id}`,
            price: it.line_total ?? it.unit_price ?? 0,
          })) || [];
        setItems(mapped);
      } catch (err) {
        console.error(err);
        message.error("ไม่สามารถโหลดคำสั่งซื้อ");
      }
    };
    load();
  }, [orderIdParam]);

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price, 0), [items]);
  const fee = 0;
  // ✅ ตัดส่วนลดออก
  const total = useMemo(() => subtotal + fee, [subtotal]);

  const orderId = order?.id;

  const handleSubmitSlip = async () => {
    if (!files.length) {
      message.warning("กรุณาแนบสลิปการชำระเงิน");
      return;
    }
    if (!orderId) {
      message.error("ไม่พบหมายเลขคำสั่งซื้อ");
      return;
    }
    try {
      setSubmitting(true);

      // 1) สร้างข้อมูลการชำระเงิน
      const res = await fetch("http://localhost:8088/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          amount: total,
          status: "PENDING",
        }),
      });
      if (!res.ok) throw new Error("create payment failed");
      const payment = await res.json();
      const paymentId = payment.id || payment.ID;

      // 2) อัปโหลดสลิปการชำระเงิน
      const form = new FormData();
      form.append("file", files[0].originFileObj as File);
      form.append("payment_id", String(paymentId));
      form.append("order_id", String(orderId));
      const slipRes = await fetch("http://localhost:8088/payment_slips", {
        method: "POST",
        body: form,
      });
      if (!slipRes.ok) throw new Error("upload slip failed");

      // 3) อัปเดตสถานะคำสั่งซื้อหลังส่งสลิปสำเร็จ
      await fetch(`http://localhost:8088/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_status: "PAID" }),
      });

      // 4) แจ้งผลลัพธ์และเคลียร์สถานะไฟล์
      message.success(`ส่งยืนยันการชำระเงินเรียบร้อย (ชำระเงินเลขที่ ${paymentId})`);
      setOrder({ ...order, order_status: "PAID" });
      setPayOpen(false);
      setFiles([]);
    } catch (err) {
      console.error(err);
      message.error("ส่งสลิปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, background: BG_DARK, minHeight: "100vh", flex: 1, justifyContent: "space-between", }}>
      <Typography.Title level={2} style={{ color: THEME_PRIMARY, textAlign: "center", marginBottom: 24 }}>
        YOUR GAME CART
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            {items.map((it) => (
              <Card
                key={it.id}
                hoverable
                className="payment-item"
                style={{ borderRadius: 14, background: CARD_DARK, borderColor: BORDER }}
                bodyStyle={{ padding: 16 }}
              >
                <Row align="middle" gutter={[12, 12]}>
                  <Col flex="auto">
                    <Typography.Title level={4} style={{ margin: 0, color: TEXT_MAIN }}>
                      {it.title}
                    </Typography.Title>
                    <Space size="small" wrap>
                      <Tag color="default" style={{ borderColor: THEME_PRIMARY, color: THEME_PRIMARY, background: "transparent" }}>
                        สำหรับบัญชีของฉัน
                      </Tag>
                      {it.note && (
                        <Tag color="purple" style={{ backgroundColor: `${THEME_PRIMARY}22`, color: THEME_PRIMARY, borderColor: THEME_PRIMARY }}>
                          {it.note}
                        </Tag>
                      )}
                    </Space>
                  </Col>
                  <Col>
                    <Typography.Title level={4} style={{ margin: 0, color: TEXT_MAIN }}>
                      {formatTHB(it.price)}
                    </Typography.Title>
                  </Col>
                </Row>
              </Card>
            ))}

            <Button
              type="default"
              size="large"
              style={{
                width: "100%",
                borderColor: THEME_PRIMARY,
                color: THEME_PRIMARY,
                background: "transparent",
              }}
            >
              ดำเนินการเลือกซื้อต่อไป
            </Button>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ borderRadius: 16, background: CARD_DARK, borderColor: BORDER }} bodyStyle={{ padding: 16 }}>
            <Typography.Title level={4} style={{ marginTop: 4, color: TEXT_MAIN }}>
              สรุปการสั่งซื้อ
            </Typography.Title>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Row>
                <Col flex="auto" style={{ color: TEXT_SUB }}>
                  ราคารวม
                </Col>
                <Col style={{ color: TEXT_MAIN }}>{formatTHB(subtotal)}</Col>
              </Row>
              <Row>
                <Col flex="auto" style={{ color: TEXT_SUB }}>
                  ค่าธรรมเนียม
                </Col>
                <Col style={{ color: TEXT_MAIN }}>{formatTHB(fee)}</Col>
              </Row>

              <Divider style={{ margin: "8px 0", borderColor: BORDER }} />

              <Row>
                <Col flex="auto">
                  <strong style={{ color: TEXT_MAIN }}>ราคารวมโดยประมาณ</strong>
                </Col>
                <Col>
                  <Typography.Title level={2} style={{ margin: 0, color: "#fff" }}>
                    {formatTHB(total)}
                  </Typography.Title>
                </Col>
              </Row>
              <Typography.Paragraph style={{ marginTop: -4, color: TEXT_SUB }}>
                หากมีการชำระเงิน ค่าจะถูกกำหนดในขั้นตอนการชำระเงิน
              </Typography.Paragraph>

              {/* ❌ เอากล่องกรอกโค้ดส่วนลดออก */}

              <Button
                type="primary"
                size="large"
                style={{ backgroundColor: THEME_PRIMARY, borderColor: THEME_PRIMARY, color: "#fff" }}
                onClick={() => setPayOpen(true)}
              >
                ดำเนินการต่อไปยังการชำระเงิน
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title={<span style={{ color: THEME_PRIMARY }}>ชำระเงินด้วยคิวอาร์โค้ด</span>}
        open={payOpen}
        onCancel={() => setPayOpen(false)}
        footer={null}
        centered
        bodyStyle={{ background: CARD_DARK }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Card bordered={false} style={{ background: CARD_DARK }}>
            <div style={{ textAlign: "center" }}>
              {/* ✅ ใช้รูปคิวอาร์ที่แนบแทน QRCode component */}
              <img
                src={qrPromptPay}
                alt="PromptPay QR"
                style={{ width: 280, maxWidth: "100%", borderRadius: 12, boxShadow: "0 0 0 1px " + BORDER }}
              />
              <Typography.Paragraph style={{ marginTop: 12, color: TEXT_MAIN }}>
                <strong>จำนวนเงิน:</strong>{" "}
                <span style={{ color: THEME_PRIMARY }}>{formatTHB(total)}</span>
              </Typography.Paragraph>
              <Typography.Text style={{ color: TEXT_SUB }}>
                กรุณาสแกนและระบุอ้างอิง: {orderId}
              </Typography.Text>
            </div>
          </Card>

          <div>
            <Typography.Title level={5} style={{ marginBottom: 8, color: TEXT_MAIN }}>
              แนบสลิปการชำระเงิน
            </Typography.Title>
            <Upload.Dragger
              multiple={false}
              fileList={files}
              maxCount={1}
              accept="image/*,.pdf"
              beforeUpload={() => false}
              onChange={({ fileList }) => setFiles(fileList)}
              onRemove={() => {
                setFiles([]);
                return true;
              }}
              style={{ borderColor: THEME_PRIMARY, background: BG_DARK }}
            >
              <p className="ant-upload-drag-icon">📎</p>
              <p className="ant-upload-text" style={{ color: TEXT_MAIN }}>
                ลาก & วางไฟล์ หรือ คลิกเพื่อเลือกไฟล์
              </p>
              <p className="ant-upload-hint" style={{ color: TEXT_SUB }}>
                รองรับไฟล์ภาพหรือ PDF ขนาดไม่เกิน ~10MB
              </p>
            </Upload.Dragger>
          </div>

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setPayOpen(false)}>ยกเลิก</Button>
            <Button
              type="primary"
              disabled={!files.length}
              loading={submitting}
              style={{ backgroundColor: THEME_PRIMARY, borderColor: THEME_PRIMARY, color: "#fff" }}
              onClick={handleSubmitSlip}
            >
              ส่งยืนยันการชำระเงิน
            </Button>
          </Space>
        </Space>
      </Modal>
    </div>
  );
};

export default PaymentPage;
