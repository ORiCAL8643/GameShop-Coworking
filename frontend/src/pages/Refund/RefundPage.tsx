import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Typography,
  Upload,
  Modal,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function RefundPage() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  // 🟣 จำลองข้อมูลที่ได้จากปุ่ม "ขอรีฟันด์" จากหน้าเกม
  const mockGameData = {
    gameTitle: "Elden Ring",
    purchaseDate: "2025-08-12", // ตัวอย่าง
    orderId: "#ER-928373",
  };

  const handleSubmit = async (values: any) => {
    try {
      console.log("Refund data (mock):", {
        ...values,
        purchaseDate: mockGameData.purchaseDate, // ใช้จาก mock
        orderId: mockGameData.orderId, // ใช้จาก mock
        files: fileList.map((f) => f.name),
      });

      await new Promise((resolve) => setTimeout(resolve, 800));

      message.success("ส่งคำร้องคืนเงินเรียบร้อย! (mock)");
      form.resetFields();
      setFileList([]);
    } catch (error: any) {
      console.error("Error submitting refund (mock):", error);
      message.error("เกิดข้อผิดพลาดในการส่งคำร้อง (mock)");
    }
  };

  return (
    <div
      style={{
        background: "dark",
        minHeight: "100%",
        color: "#fbfbfbff",
        padding: "40px 20px",
        flex: 1
      }}
    >
      <style>
        {`
          .ant-form-item-label > label {
            color: white !important;
          }
          .ant-form-item {
            margin-bottom: 20px;
          }
        `}
      </style>

      <Card
        style={{
          background: "rgba(40, 40, 40, 0.95)",
          borderRadius: 16,
          maxWidth: 650,
          margin: "0 auto",
          padding: "30px 25px",
          boxShadow: "0 8px 30px rgba(146, 84, 222, 0.4)",
        }}
        bordered={false}
      >
        <Title
          level={2}
          style={{
            textAlign: "center",
            background: "linear-gradient(90deg, #9254de, #f759ab)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 32,
          }}
        >
          Refund Request
        </Title>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Order ID (readonly) */}
          <Form.Item label="Order ID">
            <Input value={mockGameData.orderId} readOnly />
          </Form.Item>

          {/* Game Title (readonly) */}
          <Form.Item label="Game Title">
            <Input value={mockGameData.gameTitle} readOnly />
          </Form.Item>

          {/* Purchase Date (readonly) */}
          <Form.Item label="Purchase Date">
            <Input value={mockGameData.purchaseDate} readOnly />
          </Form.Item>

          {/* Reason (user input) */}
          <Form.Item
            label="Reason for Refund"
            name="reason"
            rules={[{ required: true, message: "กรุณาเลือกเหตุผล" }]}
          >
            <Select placeholder="Select reason">
              <Select.Option value="defective">Defective Product</Select.Option>
              <Select.Option value="incorrect">Incorrect Item Received</Select.Option>
              <Select.Option value="late">Item Arrived Late</Select.Option>
              <Select.Option value="not_described">Item Not as Described</Select.Option>
              <Select.Option value="duplicate">Duplicate Order</Select.Option>
              <Select.Option value="accidental">Accidental Purchase</Select.Option>
              <Select.Option value="billing">Billing Issue</Select.Option>
              <Select.Option value="not_received">Did Not Receive Item</Select.Option>
              <Select.Option value="wrong_version">Wrong Platform/Version</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>

          {/* Bank (user input) */}
          <Form.Item
            label="Bank"
            name="bank"
            rules={[{ required: true, message: "กรุณาเลือกธนาคาร" }]}
          >
            <Select placeholder="Select bank">
              <Select.Option value="kbank">Kasikorn Bank (KBANK)</Select.Option>
              <Select.Option value="scb">Siam Commercial Bank (SCB)</Select.Option>
              <Select.Option value="bbl">Bangkok Bank (BBL)</Select.Option>
              <Select.Option value="ktb">Krungthai Bank (KTB)</Select.Option>
              <Select.Option value="tmb">TMBThanachart Bank (TTB)</Select.Option>
              <Select.Option value="gsb">Government Savings Bank (GSB)</Select.Option>
              <Select.Option value="bay">Krungsri Bank (BAY)</Select.Option>
              <Select.Option value="uob">UOB</Select.Option>
              <Select.Option value="cimb">CIMB Thai</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>

          {/* Account Number (user input) */}
          <Form.Item
            label="Account Number"
            name="accountNumber"
            rules={[
              { required: true, message: "กรุณากรอกเลขบัญชี" },
              { pattern: /^[0-9]{10,16}$/, message: "เลขบัญชีต้อง 10-16 ตัวเลข" },
            ]}
          >
            <Input placeholder="Enter your account number" />
          </Form.Item>

          {/* Comments */}
          <Form.Item label="Additional Comments" name="comments">
            <Input.TextArea rows={3} placeholder="Provide any additional details" />
          </Form.Item>

          {/* Upload */}
          <Form.Item label="Upload Proof" required>
            <Upload
              name="file"
              listType="picture-card"
              fileList={fileList}
              onPreview={(file) => window.open(file.url || file.thumbUrl, "_blank")}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              onRemove={(file) =>
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid))
              }
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

          {/* Modal Preview */}
          <Modal
            open={previewVisible}
            title={previewTitle}
            footer={null}
            onCancel={() => setPreviewVisible(false)}
          >
            <img alt="example" style={{ width: "100%" }} src={previewImage} />
          </Modal>

          {/* Submit */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                background: "linear-gradient(90deg, #9254de 0%, #f759ab 100%)",
                border: "none",
                color: "white",
                width: "100%",
                height: 45,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Submit Request
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
