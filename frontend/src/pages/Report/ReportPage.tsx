// src/pages/Report/ReportPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Upload,
  message,
  Typography,
  Divider,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { createReport } from "../../services/Report";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

export default function ReportPage() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  // ===== FORCE ID (แก้ให้ตรง DB ของคุณ) =====
  // แนะนำตั้งใน .env เช่น VITE_FORCE_USER_ID=1
  const ENV_FORCE_USER_ID = Number(import.meta.env.VITE_FORCE_USER_ID || "");
  // ใช้ user id จาก auth ถ้ามี; ถ้าไม่มี ใช้ ENV; ถ้าไม่มีอีก fallback เป็น 1
  const userId =
    (auth as any)?.id ??
    (Number.isFinite(ENV_FORCE_USER_ID) && ENV_FORCE_USER_ID > 0
      ? ENV_FORCE_USER_ID
      : 1);

  // ===== Theme =====
  const PAGE_BG =
    "radial-gradient(1200px 600px at 20% -10%, rgba(157, 78, 221, .25), transparent 60%), radial-gradient(1000px 500px at 100% 10%, rgba(247, 89, 171, .20), transparent 65%), linear-gradient(135deg, #0b0a14 0%, #15122a 45%, #1b1740 100%)";
  const PURPLE = "#9254de";

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      // เตือนถ้า baseURL ของ api ยังไม่ตั้ง
      if (!import.meta.env.VITE_API_URL) {
        console.warn(
          "[Report] VITE_API_URL ยังไม่ได้ตั้งค่าใน .env — จะยิงไป origin เดียวกับ frontend"
        );
      }

      const files: File[] = (fileList || [])
        .map((f: any) => f?.originFileObj)
        .filter(Boolean);

      console.log("[Report] will POST /reports with:", {
        title: values.title,
        description: values.description,
        category: values.category,
        user_id: userId,
        filesCount: files.length,
      });

      await createReport({
        title: values.title,
        description: values.description,
        category: values.category,
        user_id: userId,
        files,
      });

      message.success("ส่งรายงานปัญหาเรียบร้อย!");
      form.resetFields();
      setFileList([]);
      navigate("/report/success", { state: { title: values.title } });
    } catch (e: any) {
      // แสดง error ที่ชัดขึ้น
      const apiMsg: string =
        e?.response?.data?.error ||
        e?.message ||
        "เกิดข้อผิดพลาดในการส่งรายงาน";

      console.error("[Report] POST /reports failed:", e);

      if (/user not found/i.test(apiMsg)) {
        message.error(
          `ไม่พบผู้ใช้ในฐานข้อมูล (user_id=${userId}) — โปรดสร้างผู้ใช้นี้ใน DB หรือเปลี่ยน VITE_FORCE_USER_ID`
        );
      } else {
        message.error(apiMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="report-page"
      style={{
        width: "100%",
        minHeight: "100vh",
        background: PAGE_BG,
        padding: "48px 16px 64px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        color: "#fff",
      }}
    >
      <style>
        {`
          .report-page .glass-card {
            background: linear-gradient(180deg, rgba(16,12,35,.86) 0%, rgba(12,9,27,.86) 100%);
            border: 1px solid rgba(157, 78, 221, .25);
            border-radius: 18px;
            box-shadow:
              0 18px 44px rgba(0,0,0,.45),
              inset 0 1px 0 rgba(255,255,255,.04),
              0 0 0 1px rgba(157,78,221,.12);
            overflow: hidden;
            backdrop-filter: blur(6px);
          }
          .report-page .title-gradient {
            background: linear-gradient(90deg, #9254de, #ff5ca8);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            letter-spacing: .3px;
          }
          .report-page .divider-line {
            height: 2px;
            width: 100%;
            background: linear-gradient(90deg, #9254de, transparent);
            opacity: .9;
            border-radius: 999px;
            margin-top: 8px;
          }
          .report-page .ant-input,
          .report-page textarea.ant-input,
          .report-page .ant-select-selector {
            background: #0f0f17 !important;
            color: #f7f4ff !important;
            border: 1px solid rgba(157,78,221,.45) !important;
            border-radius: 12px !important;
          }
          .report-page .ant-select-arrow { color: #e6dbff !important; }
          .report-page .ant-input::placeholder,
          .report-page textarea.ant-input::placeholder { color: #cfc5ff !important; }
          .report-page .ant-input:hover,
          .report-page .ant-input:focus,
          .report-page textarea.ant-input:hover,
          .report-page textarea.ant-input:focus,
          .report-page .ant-select-selector:hover,
          .report-page .ant-select-focused .ant-select-selector {
            border-color: #b388ff !important;
            box-shadow: 0 0 0 2px rgba(157,78,221,.28) !important;
          }
          .report-page .ant-upload.ant-upload-select-picture-card {
            background: #0f0f17 !important;
            border: 1px dashed ${PURPLE} !important;
            border-radius: 12px;
          }
          .report-page .ant-upload.ant-upload-select-picture-card:hover {
            border-color: #b388ff !important;
          }
          .report-page .ant-upload-list-item {
            background: #141322 !important;
            border-color: rgba(157,78,221,.35) !important;
            border-radius: 12px !important;
          }
          .report-page .purple-btn {
            background: linear-gradient(90deg, #9254de 0%, #ff5ca8 100%);
            border: none; color: #fff; font-weight: 800;
            box-shadow: 0 10px 24px rgba(157,78,221,.35);
          }
          .report-page .purple-btn:hover { filter: brightness(1.05); }
          .report-page .purple-btn:active { transform: translateY(1px); }
        `}
      </style>

      <Card
        className="glass-card"
        bordered={false}
        style={{ width: "100%", maxWidth: 820 }}
        headStyle={{ padding: "18px 22px" }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Title level={3} style={{ margin: 0 }}>
              <span className="title-gradient">📝 รายงานปัญหา</span>
            </Title>
          </div>
        }
        bodyStyle={{ padding: 24 }}
      >
        <div className="divider-line" />

        <div style={{ marginTop: 10, marginBottom: 16 }}>
          <Text style={{ color: "#c9c3ff" }}>
            ช่วยอธิบายปัญหาให้ละเอียดและแนบภาพประกอบเพื่อให้ทีมงานตรวจสอบได้เร็วขึ้น
          </Text>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={<Text strong style={{ color: "#efeaff" }}>หมวดปัญหา</Text>}
            name="category"
            rules={[{ required: true, message: "กรุณาเลือกหมวดปัญหา" }]}
          >
            <Select
              placeholder="เลือกหมวดปัญหา"
              options={[
                { value: "technical", label: "⚙️ ปัญหาทางเทคนิค" },
                { value: "billing", label: "💳 ปัญหาการเรียกเก็บเงิน" },
                { value: "login", label: "🔐 เข้าสู่ระบบ/ยืนยันตัวตน" },
                { value: "ui", label: "🖥️ หน้าตา/การใช้งาน (UI/UX)" },
                { value: "performance", label: "🚀 ประสิทธิภาพช้า/หน่วง" },
                { value: "crash", label: "💥 แอปค้าง/เด้ง" },
                { value: "purchase", label: "🛒 ซื้อ/ชำระเงินผิดพลาด" },
                { value: "content", label: "📦 เนื้อหาหาย/ไม่ถูกต้อง" },
                { value: "feedback", label: "💬 ข้อเสนอแนะ" },
                { value: "other", label: "❓ อื่น ๆ" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong style={{ color: "#efeaff" }}>หัวข้อ</Text>}
            name="title"
            rules={[{ required: true, message: "กรุณากรอกหัวข้อ" }]}
          >
            <Input placeholder="สรุปปัญหาแบบสั้น ๆ" />
          </Form.Item>

          <Form.Item
            label={<Text strong style={{ color: "#f7eaffd9" }}>รายละเอียด</Text>}
            name="description"
            rules={[{ required: true, message: "กรุณากรอกรายละเอียด" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="อธิบายขั้นตอนที่ทำ เกิดอะไรขึ้น และคาดหวังให้เกิดอะไร"
            />
          </Form.Item>

          <Divider style={{ borderColor: "rgba(255,255,255,.12)", margin: "8px 0 16px" }} />

          <Form.Item
            label={<Text strong style={{ color: "#efeaff" }}>อัปโหลดภาพหน้าจอ / หลักฐาน</Text>}
            name="attachments"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            extra={<span style={{ color: "#bfb6ff" }}>รองรับ JPG/PNG/WebP สูงสุด 3 รูป</span>}
          >
            <Upload
              name="attachments"
              listType="picture-card"
              fileList={fileList}
              accept="image/png,image/jpeg,image/webp"
              multiple
              onPreview={(file) => {
                window.open((file as any).url || (file as any).thumbUrl, "_blank");
              }}
              onChange={({ fileList: fl }) => setFileList(fl)}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
              beforeUpload={(file) => {
                const isImage =
                  file.type?.startsWith("image/") ||
                  /\.(jpg|jpeg|png|webp)$/i.test(file.name || "");
                if (!isImage) message.error("อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น");
                return false; // ไม่อัปโหลดทันที
              }}
              maxCount={3}
            >
              {fileList.length < 3 && (
                <div
                  style={{
                    background: "#0f0f17",
                    borderRadius: 12,
                    padding: 10,
                    border: `1px dashed ${PURPLE}`,
                    color: "#cfc5ff",
                    width: 110,
                    aspectRatio: "1/1",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <UploadOutlined />
                    <div style={{ marginTop: 6, fontWeight: 600 }}>Upload</div>
                  </div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              className="purple-btn"
              loading={submitting}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                fontSize: 16,
                letterSpacing: 0.3,
              }}
            >
              {submitting ? "กำลังส่ง..." : "ส่งรายงานปัญหา"}
            </Button>
          </Form.Item>

  
        </Form>
      </Card>
    </div>
  );
}
