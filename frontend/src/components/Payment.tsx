import { useMemo, useState } from "react";
import {
  Row, Col, Card, Button, Typography, Space, Tag, Divider, Modal, Upload, message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { PlusOutlined, MinusOutlined, DeleteOutlined, HistoryOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const THEME_PRIMARY = "#9b59b6";
const BG_DARK = "#1e1e2f";
const CARD_DARK = "#171923";
const BORDER = "#2b2f3a";
const TEXT_MAIN = "#e8e8f3";
const TEXT_SUB = "#a9afc3";

const API = "http://localhost:8088";
import qrPromptPay from "../assets/ktb-qr.png";

const formatTHB = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ✅ helper: แปลงไฟล์เป็น base64 สำหรับพรีวิวกรณีที่ยังไม่มี url/thumbUrl
const getBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

export default function PaymentPage() {
  const { items, updateQty, removeItem, clearCart } = useCart();
  const [payOpen, setPayOpen] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ✅ พรีวิวสลิป
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const navigate = useNavigate();

  // ✅ เอาค่าจาก AuthContext
  const { id: userId, token } = useAuth() as { id: number | null; token?: string };

  // ✅ รวม header ที่ต้องใช้ยืนยันตัวตน (รองรับทั้ง JWT และ X-User-ID)
  const authHeaders = () => {
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (userId) h["X-User-ID"] = String(userId);
    return h;
  };

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.quantity, 0), [items]);
  const total = useMemo(() => subtotal, [subtotal]);

  const incQuantity = (gameId: number) =>
    updateQty(gameId, (items.find(i => i.id === gameId)?.quantity ?? 1) + 1);

  const decQuantity = (gameId: number) => {
    const cur = items.find(i => i.id === gameId)?.quantity ?? 1;
    updateQty(gameId, Math.max(1, cur - 1));
  };

  // ✅ handler: เปิดพรีวิวเมื่อคลิกไฟล์ใน Upload list
  const handlePreview = async (file: UploadFile) => {
    // ถ้าเป็น PDF ให้เปิดแท็บใหม่แทน
    if (file.type?.includes("pdf")) {
      try {
        const blobUrl =
          (file.originFileObj && URL.createObjectURL(file.originFileObj)) ||
          (typeof file.url === "string" ? file.url : "");
        if (blobUrl) {
          window.open(blobUrl, "_blank");
          return;
        }
      } catch (e) {
        // ถ้าเปิดแท็บไม่ได้ ให้แจ้งเตือนแทน
      }
      message.info("ไฟล์ PDF จะเปิดในแท็บใหม่เมื่ออัปโหลดสำเร็จ");
      return;
    }

    // รูปภาพ: เตรียม src (url | thumbUrl | base64)
    if (!file.url && !file.preview && file.originFileObj) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage((file.url as string) || (file.thumbUrl as string) || (file.preview as string));
    setPreviewTitle(file.name || "สลิปการชำระเงิน");
    setPreviewOpen(true);
  };

  // ✅ handler: ลบไฟล์ปัจจุบัน (ใช้ได้ทั้งจากไอคอนถังขยะของ Upload และปุ่มใน Modal พรีวิว)
  const handleRemove = () => {
    setFiles([]);
    setPreviewOpen(false);
    setPreviewImage("");
    setPreviewTitle("");
    return true;
  };

  const handleSubmitSlip = async () => {
    if (!files.length) {
      message.warning("กรุณาแนบสลิปการชำระเงิน");
      return;
    }
    if (!items.length) {
      message.error("ไม่มีรายการสินค้า");
      return;
    }
    if (!userId) {
      message.error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
      return;
    }

    try {
      setSubmitting(true);

      // 1) สร้าง Order (ฝั่ง server จะคำนวณราคาจริง/โปรฯ เอง)
      const orderRes = await fetch(`${API}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(), // ✅ ส่งตัวตนไปหา backend
        },
        body: JSON.stringify({
          // ❌ ไม่ส่ง user_id ใน body เพื่อกันสวมรอยตามที่ backend ออกแบบ
          items: items.map((it) => ({ game_id: it.id, qty: it.quantity })),
        }),
      });
      if (!orderRes.ok) throw new Error("create order failed");
      const order = await orderRes.json();
      const orderId = order.ID ?? order.id;
      if (!orderId) throw new Error("missing order id");

      // 2) อัปโหลดสลิป → /payments (multipart: order_id, file)
      const form = new FormData();
      form.append("order_id", String(orderId));
      form.append("file", files[0].originFileObj as File);

      const payRes = await fetch(`${API}/payments`, {
        method: "POST",
        headers: {
          ...authHeaders(), // ✅ แนบ header เช่นกัน (บางระบบใช้เช็คสิทธิ์)
        },
        body: form,
      });
      if (!payRes.ok) throw new Error("upload slip failed");

      // 3) แจ้งผู้ใช้ / เคลียร์ตะกร้า / ไปหน้าสถานะ
      message.success("ส่งการยืนยันสำเร็จ กรุณารอการอัปเดตสถานะ");
      setPayOpen(false);
      setFiles([]);
      clearCart();
      navigate("/orders-status");
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "ส่งสลิปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, background: BG_DARK, minHeight: "100vh", flex: 1 }}>
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
                // ⬇️ เปลี่ยน bodyStyle → styles
                styles={{ body: { padding: 16 } }}
              >
                <Row align="middle" gutter={[12, 12]}>
                  <Col flex="auto">
                    <Typography.Title level={4} style={{ margin: 0, color: TEXT_MAIN }}>
                      {it.title}
                    </Typography.Title>

                    <Space size="small" wrap>
                      {it.note && (
                        <Tag
                          color="purple"
                          style={{
                            backgroundColor: `${THEME_PRIMARY}22`,
                            color: THEME_PRIMARY,
                            borderColor: THEME_PRIMARY,
                          }}
                        >
                          {it.note}
                        </Tag>
                      )}
                    </Space>

                    <Space style={{ marginTop: 8 }}>
                      <Button size="small" icon={<MinusOutlined />} onClick={() => decQuantity(it.id)} />
                      <Typography.Text style={{ color: TEXT_MAIN }}>{it.quantity}</Typography.Text>
                      <Button size="small" icon={<PlusOutlined />} onClick={() => incQuantity(it.id)} />
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(it.id)} />
                    </Space>
                  </Col>

                  <Col>
                    <Space direction="vertical" align="end" size={0}>
                      <Typography.Text style={{ color: TEXT_SUB }}>
                        ราคาเกม: {formatTHB(it.price)}
                      </Typography.Text>
                      <Typography.Title level={4} style={{ margin: 0, color: TEXT_MAIN }}>
                        ราคารวม: {formatTHB(it.price * it.quantity)}
                      </Typography.Title>
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))}

            <Button
              type="default"
              size="large"
              style={{ width: "100%", borderColor: THEME_PRIMARY, color: THEME_PRIMARY, background: "transparent" }}
              onClick={() => navigate("/home")}
            >
              ดำเนินการเลือกซื้อต่อไป
            </Button>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{ borderRadius: 16, background: CARD_DARK, borderColor: BORDER }}
            styles={{ body: { padding: 16 } }}
          >
            <Typography.Title level={4} style={{ marginTop: 4, color: TEXT_MAIN }}>
              สรุปการสั่งซื้อ
            </Typography.Title>

            <Space direction="vertical" style={{ width: "100%" }}>
              <Divider style={{ margin: "10px 0", borderColor: BORDER }} />
              <Row>
                <Col flex="auto">
                  <strong style={{ color: TEXT_MAIN }}>ราคารวม</strong>
                </Col>
                <Col>
                  <Typography.Title level={2} style={{ margin: 0, color: "#fff" }}>
                    {formatTHB(total)}
                  </Typography.Title>
                </Col>
              </Row>
              <Typography.Paragraph style={{ marginTop: -4, color: TEXT_SUB }}>
                *โปรดชำระเงินให้ตรงกับยอดที่แสดง
              </Typography.Paragraph>

              <Space direction="vertical" style={{ width: "100%" }} size={10}>
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ backgroundColor: THEME_PRIMARY, borderColor: THEME_PRIMARY, color: "#ffffffff" }}
                  onClick={() => setPayOpen(true)}
                  disabled={!items.length}
                >
                  ดำเนินการต่อไปยังการชำระเงิน
                </Button>

                <Button
                  size="large"
                  block
                  icon={<HistoryOutlined />}
                  style={{ borderColor: THEME_PRIMARY, color: THEME_PRIMARY, background: "transparent" }}
                  onClick={() => navigate("/orders-status")}
                >
                  ดูสถานะคำสั่งซื้อ
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ===== Modal ชำระเงิน & อัปโหลดสลิป ===== */}
      <Modal
        title={<span style={{ color: THEME_PRIMARY }}>ชำระเงินด้วยคิวอาร์โค้ด</span>}
        open={payOpen}
        onCancel={() => setPayOpen(false)}
        footer={null}
        centered
        // ⬇️ เปลี่ยน bodyStyle → styles
        styles={{ body: { background: CARD_DARK } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Card bordered={false} style={{ background: CARD_DARK }} styles={{ body: { padding: 0 } }}>
            <div style={{ textAlign: "center" }}>
              <img
                src={qrPromptPay}
                alt="PromptPay QR"
                style={{ width: 280, maxWidth: "100%", borderRadius: 12, boxShadow: "0 0 0 1px " + BORDER }}
              />
              <Typography.Paragraph style={{ marginTop: 12, color: TEXT_MAIN }}>
                <strong>จำนวนเงิน</strong>{" "}
                <span style={{ color: THEME_PRIMARY }}>{formatTHB(total)}</span>
              </Typography.Paragraph>
            </div>
          </Card>

          {/* ✅ อัปโหลด + พรีวิว + ลบไฟล์ */}
          <div>
            <Typography.Title level={5} style={{ marginBottom: 8, color: TEXT_MAIN }}>
              แนบสลิปการชำระเงิน
            </Typography.Title>
            <Upload.Dragger
               className="slip-uploader"          // ✅ เพิ่มคลาส
                multiple={false}
                fileList={files}
                maxCount={1}
                accept="image/*,.pdf"
                listType="picture"
                showUploadList={{ showRemoveIcon: true, showPreviewIcon: true }}
                beforeUpload={() => false}
                onPreview={handlePreview}
                onChange={({ fileList }) => setFiles(fileList)}
                onRemove={handleRemove}
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
              style={{ backgroundColor: THEME_PRIMARY, borderColor: THEME_PRIMARY, color: "#ffffffff" }}
              onClick={handleSubmitSlip}
            >
              ส่งยืนยันการชำระเงิน
            </Button>
          </Space>
        </Space>
      </Modal>

      {/* ✅ Modal พรีวิวรูปสลิป */}
      <Modal
        open={previewOpen}
        title={<span style={{ color: THEME_PRIMARY }}>{previewTitle || "ตัวอย่างสลิป"}</span>}
        footer={
          <Space>
            <Button danger onClick={handleRemove}>ลบไฟล์นี้</Button>
            <Button onClick={() => setPreviewOpen(false)}>ปิด</Button>
          </Space>
        }
        onCancel={() => setPreviewOpen(false)}
        centered
        styles={{ body: { background: CARD_DARK } }}
      >
        {previewImage ? (
          <img
            alt="Slip Preview"
            style={{ width: "100%", borderRadius: 10, boxShadow: `0 0 0 1px ${BORDER}` }}
            src={previewImage}
          />
        ) : (
          <Typography.Text style={{ color: TEXT_SUB }}>ไม่พบรูปสำหรับพรีวิว</Typography.Text>
        )}
      </Modal>
    </div>
  );
}
