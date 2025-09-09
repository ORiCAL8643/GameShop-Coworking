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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { createReport } from "../../services/Report";

export default function ReportPage() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const navigate = useNavigate();

  // 🔧 ปรับให้ตรงกับข้อมูลจริงใน DB ของคุณ
  //   - ต้องมี user id และ game id ที่มีอยู่จริง ไม่งั้น backend จะ 404
  const DEFAULT_USER_ID = 1;
  const DEFAULT_GAME_ID = 1;

  const PAGE_BG =
    "linear-gradient(135deg, #0b0a14 0%, #15122a 45%, #1b1740 100%)";
  const PURPLE = "#9254de";
  const PURPLE_LIGHT = "#b388ff";

  const handleSubmit = async (values: any) => {
    try {
      const files: File[] = (fileList || [])
        .map((f: any) => f?.originFileObj)
        .filter(Boolean);

      await createReport({
        title: values.title,
        description: values.description,
        user_id: DEFAULT_USER_ID,
        game_id: DEFAULT_GAME_ID,
        status: "open",
        files,
      });

      message.success("ส่งรายงานปัญหาเรียบร้อย!");
      form.resetFields();
      setFileList([]);

      // ไปหน้า success พร้อมส่งหัวข้อไปแสดง
      navigate("/report/success", { state: { title: values.title } });
    } catch (e: any) {
      const apiMsg =
        e?.response?.data?.error ||
        e?.message ||
        "เกิดข้อผิดพลาดในการส่งรายงาน";
      message.error(apiMsg);
      // แนะนำสาเหตุพบบ่อย:
      // - user_id / game_id ไม่มีใน DB → สร้าง/ใช้ id ที่มีจริง
      // - backend ไม่ได้รันที่พอร์ตเดียวกับ VITE_API_BASE_URL
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
      <style>
        {`
          .report-page .card-title {
            display:flex; align-items:center; gap:8px;
            font-weight:800; letter-spacing:.2px;
            background: linear-gradient(90deg, ${PURPLE} 0%, #ff5ca8 100%);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          }
          .report-page .ant-card {
            background: rgba(15,14,24,.96);
            border-radius: 16px;
            box-shadow: 0 10px 34px rgba(146,84,222,.2), 0 2px 10px rgba(0,0,0,.35);
          }
          .report-page .ant-card-head { border-bottom: 1px solid rgba(146,84,222,.25); }
          .report-page .divider-line {
            height:2px; width:100%; margin-top:8px;
            background: linear-gradient(90deg, ${PURPLE}, transparent); opacity:.85; border-radius:999px;
          }
          .report-page .ant-input,
          .report-page textarea.ant-input,
          .report-page .ant-select-selector {
            background: #0f0f17 !important;
            color: #eae6ff !important;
            border: 1px solid rgba(146,84,222,.35) !important;
            border-radius: 10px !important;
          }
          .report-page .ant-select-selection-item,
          .report-page .ant-select-selection-placeholder { color: #cfc5ff !important; }
          .report-page .ant-select-arrow { color: #e6dbff !important; }
          .report-page .ant-input::placeholder,
          .report-page textarea.ant-input::placeholder { color: #cfc5ff !important; }
          .report-page .ant-input:hover,
          .report-page .ant-input:focus,
          .report-page textarea.ant-input:hover,
          .report-page textarea.ant-input:focus,
          .report-page .ant-select-selector:hover,
          .report-page .ant-select-focused .ant-select-selector {
            border-color: ${PURPLE} !important;
            box-shadow: 0 0 0 2px rgba(146,84,222,.28) !important;
          }
          .report-page .report-select .ant-select-item {
            background: #0f0f17; color: #eae6ff;
          }
          .report-page .report-select .ant-select-item-option-active {
            background: rgba(146,84,222,.25);
          }
          .report-page .ant-upload.ant-upload-select-picture-card {
            background: #0f0f17 !important;
            border: 1px dashed ${PURPLE} !important;
          }
          .report-page .ant-upload.ant-upload-select-picture-card:hover {
            border-color: ${PURPLE_LIGHT} !important;
          }
          .report-page .ant-upload-list-item {
            background: #141322 !important;
            border-color: rgba(146,84,222,.35) !important;
          }
          .report-page .ant-form-item-label > label {
            color: #e9e1ff !important; font-weight: 600;
          }
          .report-page .purple-btn {
            background: linear-gradient(90deg, ${PURPLE} 0%, #ff5ca8 100%);
            border: none; color: #fff;
          }
          .report-page .purple-btn:hover { filter: brightness(1.05); }
        `}
      </style>

      <Card
        bordered={false}
        style={{ width: "100%", maxWidth: 720 }}
        title={
          <div>
            <span className="card-title">📝 รายงานปัญหา</span>
            <div className="divider-line" />
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="หมวดปัญหา"
            name="category"
            rules={[{ required: true, message: "กรุณาเลือกหมวดปัญหา" }]}
          >
            <Select placeholder="เลือกหมวดปัญหา" popupClassName="report-select">
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
              name="attachments" // ✅ ชื่อตรงกับ backend
              listType="picture-card"
              fileList={fileList}
              onPreview={(file) => {
                window.open((file as any).url || (file as any).thumbUrl, "_blank");
              }}
              onChange={({ fileList: fl }) => setFileList(fl)}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
              beforeUpload={(file) => {
                const isImage = file.type?.startsWith("image/");
                if (!isImage) message.error("อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น");
                return false; // ไม่อัปโหลดทันที
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
              className="purple-btn"
              style={{ width: "100%", height: 46, fontWeight: 700, borderRadius: 10 }}
            >
              ส่งรายงานปัญหา
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
