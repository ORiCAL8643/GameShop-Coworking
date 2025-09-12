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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { createReport } from "../../services/Report";
import { useAuth } from "../../context/AuthContext";
import type { UploadFile } from "antd/es/upload/interface";

const { Title } = Typography;

export default function ReportPage() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const navigate = useNavigate();
  const { id: userId } = useAuth();

  const PAGE_BG = "radial-gradient(circle at top left, #2a165d, #0b0a14 70%)";
  const PURPLE = "#9254de";
  const TEXT_COLOR = "#fff";

  const toFiles = (fl: UploadFile[]): File[] =>
    (fl ?? [])
      .map((f) => (f.originFileObj ? (f.originFileObj as File) : null))
      .filter((f): f is File => !!f);

  const handleSubmit = async (values: any) => {
    try {
      const files = toFiles(fileList);

      const res = await createReport({
        title: values.title,
        description: values.description,
        category: values.category,
        user_id: Number(userId || 0),
        status: "open",
        files,
      });

      const report = (res && (res.data || res)) || {};
      const reportId = report?.id;

      message.success("✅ ส่งรายงานปัญหาเรียบร้อย!");
      form.resetFields();
      setFileList([]);

      navigate(`/report/success?id=${reportId ?? ""}`, {
        replace: true,
        state: { title: values.title, id: reportId },
      });
    } catch (e: any) {
      const apiMsg =
        e?.response?.data?.error ||
        e?.message ||
        "เกิดข้อผิดพลาดในการส่งรายงาน";
      message.error(apiMsg);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: PAGE_BG,
        padding: "60px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        color: TEXT_COLOR,
        fontSize: 15,
        lineHeight: 1.6,
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      <Card
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 24,
          background: "rgba(20, 18, 40, 0.65)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(146, 84, 222, 0.5)",
          boxShadow: `0 0 25px rgba(146, 84, 222, 0.6), inset 0 0 20px rgba(146,84,222,0.2)`,
          padding: "24px 32px",
        }}
        title={
          <div style={{ textAlign: "center" }}>
            <Title
              level={3}
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: 22,
                background: `linear-gradient(90deg, ${PURPLE} 0%, #ff5ca8 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 12px rgba(146,84,222,0.8)",
              }}
            >
              📝 รายงานปัญหา
            </Title>
            <div
              style={{
                height: 3,
                width: 100,
                margin: "12px auto 0",
                background: `linear-gradient(90deg, ${PURPLE}, #ff5ca8)`,
                borderRadius: 999,
                boxShadow: `0 0 16px ${PURPLE}`,
              }}
            />
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Select */}
          <Form.Item
            label={<span style={{ color: TEXT_COLOR, fontWeight: 600 }}>หมวดปัญหา</span>}
            name="category"
            rules={[{ required: true, message: "กรุณาเลือกหมวดปัญหา" }]}
          >
            <Select
              placeholder="เลือกหมวดปัญหา"
              style={{
                borderRadius: 12,
                color: TEXT_COLOR,
                fontSize: 15,
                background: "#141029",
                border: `1px solid ${PURPLE}`,
                boxShadow: `0 0 8px ${PURPLE}`,
              }}
              dropdownStyle={{
                background: "#9086e9ff",
                color: "#fff",
              }}
            >
              <Select.Option value="technical">⚙️ ปัญหาทางเทคนิค</Select.Option>
              <Select.Option value="billing">💳 ปัญหาการเรียกเก็บเงิน</Select.Option>
              <Select.Option value="login">🔐 เข้าสู่ระบบ/ยืนยันตัวตน</Select.Option>
              <Select.Option value="ui">🖥️ หน้าตา/การใช้งาน (UI/UX)</Select.Option>
              <Select.Option value="performance">🚀 ประสิทธิภาพช้า/หน่วง</Select.Option>
              <Select.Option value="crash">💥 แอปค้าง/เด้ง</Select.Option>
              <Select.Option value="purchase">🛒 ซื้อ/ชำระเงินผิดพลาด</Select.Option>
              <Select.Option value="content">📦 เนื้อหาหาย/ไม่ถูกต้อง</Select.Option>
              <Select.Option value="feedback">💬 ข้อเสนอแนะ</Select.Option>
              <Select.Option value="other">❓ อื่น ๆ</Select.Option>
            </Select>
          </Form.Item>

          {/* Title */}
          <Form.Item
            label={<span style={{ color: TEXT_COLOR, fontWeight: 600 }}>หัวข้อ</span>}
            name="title"
            rules={[{ required: true, message: "กรุณากรอกหัวข้อ" }]}
          >
            <Input
              placeholder="ปัญหาที่พบ"
              style={{
                background: "#5433a2ff",
                borderRadius: 12,
                border: `1px solid ${PURPLE}`,
                color: TEXT_COLOR, // ✅ ตัวอักษรขาว
                fontSize: 15,
                fontWeight: 500,
                boxShadow: `0 0 8px ${PURPLE}`,
              }}
            />
          </Form.Item>

          {/* Description */}
          <Form.Item
            label={<span style={{ color: TEXT_COLOR, fontWeight: 600 }}>รายละเอียด</span>}
            name="description"
            rules={[{ required: true, message: "กรุณากรอกรายละเอียด" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="อธิบายรายละเอียดของปัญหาให้ชัดเจน"
              style={{
                background: "#5433a2ff",
                borderRadius: 12,
                border: `1px solid ${PURPLE}`,
                color: TEXT_COLOR, // ✅ ตัวอักษรขาว
                fontSize: 15,
                lineHeight: 1.6,
                boxShadow: `0 0 8px ${PURPLE}`,
              }}
            />
          </Form.Item>

          {/* Upload */}
          <Form.Item
            label={<span style={{ color: TEXT_COLOR, fontWeight: 600 }}>อัปโหลดภาพหน้าจอ / หลักฐาน</span>}
            name="attachments"
          >
            <Upload
              name="attachments"
              listType="picture-card"
              fileList={fileList}
              onPreview={(file) => {
                window.open((file as any).url || (file as any).thumbUrl, "_blank");
              }}
              onChange={({ fileList: fl }) => setFileList(fl)}
              beforeUpload={() => false}
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
                    boxShadow: `0 0 8px ${PURPLE}`,
                  }}
                >
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>อัปโหลด</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                width: "100%",
                height: 50,
                fontWeight: 700,
                fontSize: 16,
                borderRadius: 14,
                background: `linear-gradient(90deg, ${PURPLE} 0%, #ff5ca8 100%)`,
                border: "none",
                boxShadow: `0 0 20px ${PURPLE}`,
              }}
            >
              🚀 ส่งรายงานปัญหา
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
