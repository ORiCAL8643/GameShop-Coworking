import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Typography, Card, Form, Rate, Input, Button, Space, message, Popconfirm } from "antd";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function ReviewForm() {
  const { gameId, reviewId } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(reviewId), [reviewId]);
  const [form] = Form.useForm();

  // UI-only: จำลอง set ค่าเริ่มต้นเมื่อแก้ไข
  // (ของจริงค่อยดึงค่าจาก service/Backend แล้ว setFieldsValue)
  // form.setFieldsValue({ title: "...", rating: 4, text: "..." });

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      // UI-only: ยังไม่บันทึกจริง แค่แจ้งเตือน
      message.success(isEdit ? "จำลอง: อัปเดตรีวิวแล้ว" : "จำลอง: สร้างรีวิวแล้ว");
      navigate(-1);
    } catch {
      /* validation error */
    }
  };

  const handleDelete = () => {
    // UI-only: ยังไม่ลบจริง
    message.success("จำลอง: ลบรีวิวแล้ว");
    navigate(-1);
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={3} style={{ color: "white", margin: 0 }}>
              {isEdit ? "แก้ไขรีวิว" : "เขียนรีวิว"}
            </Title>
            <Paragraph style={{ color: "#aaa", margin: 0 }}>
              {isEdit ? "UI เท่านั้น (ยังไม่บันทึกจริง)" : `UI เท่านั้น (gameId: ${gameId || "-"})`}
            </Paragraph>
          </div>

          <Form form={form} layout="vertical" requiredMark="optional">
            <Form.Item
              name="title"
              label={<span style={{ color: "#ccc" }}>หัวข้อรีวิว</span>}
              rules={[{ required: true, message: "ใส่หัวข้อด้วยครับ" }]}
            >
              <Input placeholder="เช่น สนุกมาก ระบบต่อสู้ดี" />
            </Form.Item>

            <Form.Item
              name="rating"
              label={<span style={{ color: "#ccc" }}>Rating</span>}
              rules={[{ required: true, message: "ให้คะแนนด้วยครับ" }]}
            >
              <Rate allowHalf />
            </Form.Item>

            <Form.Item
              name="text"
              label={<span style={{ color: "#ccc" }}>Your Review</span>}
              rules={[
                { required: true, message: "พิมพ์รีวิวด้วยครับ" },
                { min: 10, message: "อย่างน้อย 10 ตัวอักษร" },
              ]}
            >
              <TextArea rows={5} placeholder="เล่าประสบการณ์เล่นของคุณ…" />
            </Form.Item>

            <Space>
              <Button type="primary" onClick={handleSubmit}>
                {isEdit ? "บันทึกการแก้ไข (จำลอง)" : "โพสต์รีวิว (จำลอง)"}
              </Button>
              <Button onClick={() => navigate(-1)}>ยกเลิก</Button>
              {isEdit && (
                <Popconfirm
                  title="ต้องการลบรีวิวนี้?"
                  okText="ลบ" cancelText="ยกเลิก"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleDelete}
                >
                  <Button danger>Delete (จำลอง)</Button>
                </Popconfirm>
              )}
            </Space>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
