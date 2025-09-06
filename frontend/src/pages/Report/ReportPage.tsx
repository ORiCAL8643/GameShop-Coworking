import { useState } from "react";
import { Card, Form, Input, Button, Select, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export default function ReportPage() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]); // state คุมไฟล์

  const handleSubmit = (values: any) => {
    console.log("Report Submitted:", values);
  };

  return (
    <div
      style={{
        background: "dark",
        minHeight: "100%",
        padding: "40px 16px",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <Card
        title={
          <span style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>
            📝 Report a Problem
          </span>
        }
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 600,
          background: "#1f1f1f",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(97, 11, 96, 0.4)",
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Category */}
          <Form.Item
            label={
              <span style={{ color: "#fff", fontSize: 16 }}>
                Problem Category
              </span>
            }
            name="category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              placeholder="Select a category"
              style={{
                background: "#fff",
                color: "#000",
                borderRadius: 8,
              }}
              dropdownStyle={{ background: "#fff", color: "#000" }}
            >
              <Select.Option value="technical">⚙️ Technical Issue</Select.Option>
              <Select.Option value="billing">💳 Billing Problem</Select.Option>
              <Select.Option value="login">🔐 Login/Authentication Issue</Select.Option>
              <Select.Option value="ui">🖥️ UI/UX Bug</Select.Option>
              <Select.Option value="performance">🚀 Performance Problem</Select.Option>
              <Select.Option value="crash">💥 App Crash / Freezing</Select.Option>
              <Select.Option value="purchase">🛒 Purchase/Payment Error</Select.Option>
              <Select.Option value="content">📦 Missing or Incorrect Content</Select.Option>
              <Select.Option value="feedback">💬 Suggestion/Feedback</Select.Option>
              <Select.Option value="other">❓ Other</Select.Option>
            </Select>
          </Form.Item>

          {/* Title */}
          <Form.Item
            label={<span style={{ color: "#fff", fontSize: 16 }}>Title</span>}
            name="title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input
              placeholder="Short description"
              style={{
                background: "#fff",
                color: "#000",
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </Form.Item>

          {/* Description */}
          <Form.Item
            label={
              <span style={{ color: "#fff", fontSize: 16 }}>Description</span>
            }
            name="description"
            rules={[{ required: true, message: "Please enter a description" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Provide detailed information about the problem"
              style={{
                background: "#fff",
                color: "#000",
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
          </Form.Item>

          {/* Upload Screenshot */}
          <Form.Item
            label={
              <span style={{ color: "#fff", fontSize: 16 }}>
                Upload Screenshot / Proof
              </span>
            }
            name="attachments"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload
              name="file"
              listType="picture-card"
              fileList={fileList}
              onPreview={(file) => {
                window.open(file.url || file.thumbUrl, "_blank");
              }}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith("image/");
                if (!isImage) {
                  message.error("You can only upload image files!");
                }
                return false;
              }}
              maxCount={3}
            >
              {fileList.length < 3 && (
                <div
                  style={{
                    background: "#ffffffff",
                    borderRadius: 8,
                    padding: 8,
                    border: "1px dashed #a310d0ff",
                  }}
                >
                  <UploadOutlined style={{ color: "#000" }} />
                  <div style={{ marginTop: 8, color: "#000" }}>Upload</div>
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
                background: "linear-gradient(90deg, #a34af2, #ff5ca8)",
                border: "none",
                color: "#b7a8b9ff",
                width: "100%",
                height: 45,
                fontWeight: 600,
                borderRadius: 8,
              }}
            >
              Submit Report
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
