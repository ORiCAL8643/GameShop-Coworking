import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Select, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { createReport } from "../../services/Report";
import { useAuth } from "../../context/AuthContext";

export default function ReportPage() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const navigate = useNavigate();
  const { id: userId } = useAuth();

  // TODO: เปลี่ยนเป็นเลือกเกมจาก UI ของคุณ
  const DEFAULT_GAME_ID = 1;

  const PAGE_BG =
    "linear-gradient(135deg, #0b0a14 0%, #15122a 45%, #1b1740 100%)";
  const PURPLE = "#9254de";

  const handleSubmit = async (values: any) => {
    try {
      if (!userId) {
        message.error("กรุณาเข้าสู่ระบบก่อนส่งรายงาน");
        return;
      }

      const files: File[] = (fileList || [])
        .map((f: any) => f?.originFileObj)
        .filter(Boolean);

      await createReport({
        title: values.title,
        description: values.description,
        user_id: userId,          // ✅ ใช้ snake_case ให้ตรง backend
        game_id: DEFAULT_GAME_ID,
        status: "open",
        files,
      });

      message.success("ส่งรายงานปัญหาเรียบร้อย!");
      form.resetFields();
      setFileList([]);
      navigate("/report/success", { state: { title: values.title } });
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
      className="report-page"
      style={{
        width: "100%",
        minHeight: "100vh",
        background: PAGE_BG,
        padding: "40px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        color: "#fff",
      }}
    >
      <Card
        bordered={false}
        style={{ width: "100%", maxWidth: 720 }}
        title={
          <div>
            <span
              style={{
                fontWeight: 800,
                background: `linear-gradient(90deg, ${PURPLE} 0%, #ff5ca8 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              📝 รายงานปัญหา
            </span>
            <div
              style={{
                height: 2,
                width: "100%",
                marginTop: 8,
                background: `linear-gradient(90deg, ${PURPLE}, transparent)`,
                opacity: 0.85,
                borderRadius: 999,
              }}
            />
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="หมวดปัญหา"
            name="category"
            rules={[{ required: true, message: "กรุณาเลือกหมวดปัญหา" }]}
          >
            <Select placeholder="เลือกหมวดปัญหา">
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

          <Form.Item
            label="หัวข้อ"
            name="title"
            rules={[{ required: true, message: "กรุณากรอกหัวข้อ" }]}
          >
            <Input placeholder="ปัญหาที่พบ" />
          </Form.Item>

          <Form.Item
            label="รายละเอียด"
            name="description"
            rules={[{ required: true, message: "กรุณากรอกรายละเอียด" }]}
          >
            <Input.TextArea rows={4} placeholder="อธิบายรายละเอียดของปัญหาให้ชัดเจน" />
          </Form.Item>

          <Form.Item
            label="อัปโหลดภาพหน้าจอ / หลักฐาน"
            name="attachments"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload
              name="attachments"
              listType="picture-card"
              fileList={fileList}
              onPreview={(file) => {
                window.open((file as any).url || (file as any).thumbUrl, "_blank");
              }}
              onChange={({ fileList: fl }) => setFileList(fl)}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
              }}  // ✅ แก้จาก })} เป็น }}
              beforeUpload={(file) => {
                const isImage = file.type?.startsWith("image/");
                if (!isImage) message.error("อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น");
                return false; // ไม่อัปโหลดทันที ให้รวมส่งตอน submit
              }}
              maxCount={3}
            >
              {fileList.length < 3 && (
                <div
                  style={{
                    background: "#0f0f17",
                    borderRadius: 10,
                    padding: 8,
                    border: `1px dashed ${PURPLE}`,
                    color: "#cfc5ff",
                  }}
                >
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                width: "100%",
                height: 46,
                fontWeight: 700,
                borderRadius: 10,
                background: `linear-gradient(90deg, ${PURPLE} 0%, #ff5ca8 100%)`,
                border: "none",
              }}
            >
              ส่งรายงานปัญหา
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
