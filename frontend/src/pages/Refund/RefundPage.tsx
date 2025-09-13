// src/pages/Refund/RefundPage.tsx
import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Upload,
  Modal,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { createRefund } from "../../services/refund";

export default function RefundPage() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const { id } = useAuth();

  // 🎮 ตัวอย่างข้อมูลจากหน้าเกม (mock)
  const mockGameData = {
    gameTitle: "Elden Ring",
    purchaseDate: "2025-08-12",
    orderId: "#ER-928373",
  };

  // 🎨 โทนดาร์ก + ม่วง (ให้เข้ากับหน้าก่อนหน้า)
  const PAGE_BG = "linear-gradient(135deg, #0b0a14 0%, #15122a 45%, #1b1740 100%)";
  const PURPLE = "#9254de";
  const PURPLE_LIGHT = "#b388ff";

  const handleSubmit = async (values: any) => {
    try {
      const orderIdNum = parseInt(
        String(mockGameData.orderId).replace(/\D/g, ""),
        10
      );
      await createRefund({
        order_id: orderIdNum || 0,
        user_id: Number(id) || 0,
        reason: values.reason,
        amount: 0,
      });

      message.success("ส่งคำขอคืนเงินเรียบร้อย!");
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error(error);
      const detail = (error as any)?.response?.data?.error || "เกิดข้อผิดพลาด";
      message.error(detail);
    }
  };

  return (
    <div
      className="refund-page"
      style={{
        width: "100%",
        minHeight: "100vh",
        background: PAGE_BG,
        padding: "40px 20px",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      {/* ✅ สไตล์ดาร์ก + ไฮไลท์ม่วง เฉพาะหน้านี้ */}
      <style>
        {`
          .refund-page .card-title {
            display:flex; align-items:center; gap:8px;
            font-weight:800; letter-spacing:.2px;
            background: linear-gradient(90deg, ${PURPLE} 0%, #ff5ca8 100%);
            -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          }
          .refund-page .ant-card {
            background: rgba(15,14,24,.96);
            border-radius: 16px;
            box-shadow: 0 10px 34px rgba(146,84,222,.2), 0 2px 10px rgba(0,0,0,.35);
          }
          .refund-page .ant-card-head { border-bottom: 1px solid rgba(146,84,222,.25); }
          .refund-page .divider-line {
            height:2px; width:100%; margin-top:8px;
            background: linear-gradient(90deg, ${PURPLE}, transparent);
            opacity:.85; border-radius:999px;
          }

          /* ===== ทำฟิลด์ให้ดาร์กทั้งหมด ===== */
          .refund-page .ant-input,
          .refund-page textarea.ant-input,
          .refund-page .ant-select-selector {
            background: #0f0f17 !important;
            color: #eae6ff !important;
            border: 1px solid rgba(146,84,222,.35) !important;
            border-radius: 10px !important;
          }
          .refund-page .ant-select-selection-item,
          .refund-page .ant-select-selection-placeholder { color: #cfc5ff !important; }
          .refund-page .ant-select-arrow { color: #e6dbff !important; }
          .refund-page .ant-input::placeholder,
          .refund-page textarea.ant-input::placeholder { color: #cfc5ff !important; }

          /* โฟกัส/โฮเวอร์ = วงม่วง */
          .refund-page .ant-input:hover,
          .refund-page .ant-input:focus,
          .refund-page textarea.ant-input:hover,
          .refund-page textarea.ant-input:focus,
          .refund-page .ant-select-selector:hover,
          .refund-page .ant-select-focused .ant-select-selector {
            border-color: ${PURPLE} !important;
            box-shadow: 0 0 0 2px rgba(146,84,222,.28) !important;
          }

          /* Select dropdown ดาร์ก */
          .refund-page .refund-select .ant-select-item {
            background: #0f0f17; color: #eae6ff;
          }
          .refund-page .refund-select .ant-select-item-option-active {
            background: rgba(146,84,222,.25);
          }

          /* Upload ดาร์ก */
          .refund-page .ant-upload.ant-upload-select-picture-card {
            background: #0f0f17 !important;
            border: 1px dashed ${PURPLE} !important;
          }
          .refund-page .ant-upload.ant-upload-select-picture-card:hover {
            border-color: ${PURPLE_LIGHT} !important;
          }
          .refund-page .ant-upload-list-item {
            background: #141322 !important;
            border-color: rgba(146,84,222,.35) !important;
          }

          /* Labels */
          .refund-page .ant-form-item-label > label {
            color: #e9e1ff !important; font-weight: 600;
          }

          /* ปุ่มม่วงไล่เฉด */
          .refund-page .purple-btn {
            background: linear-gradient(90deg, ${PURPLE} 0%, #ff5ca8 100%);
            border: none; color: #fff;
          }
          .refund-page .purple-btn:hover { filter: brightness(1.05); }
        `}
      </style>

      <Card
        bordered={false}
        style={{ width: "100%", maxWidth: 700 }}
        title={
          <div>
            <span className="card-title">💸 คำขอคืนเงิน</span>
            <div className="divider-line" />
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Order ID (readonly) */}
          <Form.Item label="หมายเลขคำสั่งซื้อ">
            <Input value={mockGameData.orderId} readOnly />
          </Form.Item>

          {/* Game Title (readonly) */}
          <Form.Item label="ชื่อเกม">
            <Input value={mockGameData.gameTitle} readOnly />
          </Form.Item>

          {/* Purchase Date (readonly) */}
          <Form.Item label="วันที่สั่งซื้อ">
            <Input value={mockGameData.purchaseDate} readOnly />
          </Form.Item>

          {/* Reason */}
          <Form.Item
            label="เหตุผลการขอคืนเงิน"
            name="reason"
            rules={[{ required: true, message: "กรุณาเลือกเหตุผล" }]}
          >
            <Select
              placeholder="เลือกเหตุผล"
              popupClassName="refund-select"
              dropdownStyle={{ background: "#bea4e2ff" }}
            >
              <Select.Option value="defective">สินค้า/เกมมีปัญหา</Select.Option>
              <Select.Option value="incorrect">ได้รับไม่ตรงกับที่สั่ง</Select.Option>
              <Select.Option value="late">ได้รับล่าช้า</Select.Option>
              <Select.Option value="not_described">ไม่ตรงตามคำอธิบาย</Select.Option>
              <Select.Option value="duplicate">สั่งซื้อซ้ำ</Select.Option>
              <Select.Option value="accidental">เผลอสั่งซื้อโดยไม่ตั้งใจ</Select.Option>
              <Select.Option value="billing">ปัญหาการเรียกเก็บเงิน</Select.Option>
              <Select.Option value="not_received">ยังไม่ได้รับสินค้า/คีย์</Select.Option>
              <Select.Option value="wrong_version">แพลตฟอร์ม/เวอร์ชันไม่ถูกต้อง</Select.Option>
              <Select.Option value="other">อื่น ๆ</Select.Option>
            </Select>
          </Form.Item>

          {/* Bank */}
          <Form.Item
            label="ธนาคาร"
            name="bank"
            rules={[{ required: true, message: "กรุณาเลือกธนาคาร" }]}
          >
            <Select
              placeholder="เลือกธนาคาร"
              popupClassName="refund-select"
              dropdownStyle={{ background: "#bea4e2ff" }}
            >
              <Select.Option value="kbank">กสิกรไทย (KBANK)</Select.Option>
              <Select.Option value="scb">ไทยพาณิชย์ (SCB)</Select.Option>
              <Select.Option value="bbl">กรุงเทพ (BBL)</Select.Option>
              <Select.Option value="ktb">กรุงไทย (KTB)</Select.Option>
              <Select.Option value="ttb">ทีเอ็มบีธนชาต (TTB)</Select.Option>
              <Select.Option value="gsb">ออมสิน (GSB)</Select.Option>
              <Select.Option value="bay">กรุงศรี (BAY)</Select.Option>
              <Select.Option value="uob">ยูโอบี (UOB)</Select.Option>
              <Select.Option value="cimb">ซีไอเอ็มบีไทย (CIMB)</Select.Option>
              <Select.Option value="other">อื่น ๆ</Select.Option>
            </Select>
          </Form.Item>

          {/* Account Number */}
          <Form.Item
            label="เลขที่บัญชี"
            name="accountNumber"
            rules={[
              { required: true, message: "กรุณากรอกเลขที่บัญชี" },
              { pattern: /^[0-9]{10,16}$/, message: "เลขบัญชีต้องเป็นตัวเลข 10–16 หลัก" },
            ]}
          >
            <Input placeholder="กรอกเลขที่บัญชีของคุณ" />
          </Form.Item>

          {/* Comments */}
          <Form.Item label="รายละเอียดเพิ่มเติม" name="comments">
            <Input.TextArea rows={3} placeholder="ระบุข้อมูลเพิ่มเติม (ถ้ามี)" />
          </Form.Item>

          {/* Upload */}
          <Form.Item label="อัปโหลดหลักฐาน" required>
            <Upload
              name="file"
              listType="picture-card"
              fileList={fileList}
              onPreview={(file) =>
                window.open((file as any).url || (file as any).thumbUrl, "_blank")
              }
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              onRemove={(file) =>
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid))
              }
              beforeUpload={(file) => {
                const isImage = file.type?.startsWith("image/");
                if (!isImage) message.error("อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น");
                return false; // ❌ ไม่อัปโหลดทันที
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

          {/* Preview Modal (ถ้าอยากใช้) */}
          <Modal
            open={previewVisible}
            title={previewTitle}
            footer={null}
            onCancel={() => setPreviewVisible(false)}
          >
            <img alt="preview" style={{ width: "100%" }} src={previewImage} />
          </Modal>

          {/* Submit */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="purple-btn"
              style={{
                width: "100%",
                height: 46,
                fontWeight: 700,
                borderRadius: 10,
              }}
            >
              ส่งคำขอคืนเงิน
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
