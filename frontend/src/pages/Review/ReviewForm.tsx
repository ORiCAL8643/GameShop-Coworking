// src/pages/ReviewForm.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Typography, Card, Form, Rate, Input, Button, Space, message, Popconfirm } from "antd";
import { create, getById, update, remove } from "../services/reviewsApi";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function ReviewForm() {
  const { gameId, reviewId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(reviewId);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const gameTitle = useMemo(() => `Game #${gameId}`, [gameId]);

  useEffect(() => {
    if (isEdit && reviewId) {
      const data = getById(reviewId);
      if (!data) {
        message.error("ไม่พบรีวิวนี้");
        navigate(`/game/${gameId}`);
        return;
      }
      form.setFieldsValue({
        title: data.title,
        rating: data.rating,
        text: data.text,
      });
    }
  }, [isEdit, reviewId, form, navigate, gameId]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const { title, rating, text } = await form.validateFields();
      const user = "You"; // mock user
      if (!gameId) { message.error("ไม่พบ gameId"); return; }

      if (isEdit && reviewId) {
        const updated = update(reviewId, { title, rating, text });
        if (!updated) throw new Error("อัปเดตไม่สำเร็จ");
        message.success("แก้ไขรีวิวสำเร็จ");
      } else {
        create({ gameId, user, title, rating, text });
        message.success("สร้างรีวิวสำเร็จ");
      }
      navigate(`/game/${gameId}`);
    } catch (err: any) {
      if (err?.errorFields) return; // validation error
      message.error(err?.message || "เกิดข้อผิดพลาด");
    } finally { setLoading(false); }
  };

  const handleDelete = () => {
    if (!reviewId) return;
    const ok = remove(reviewId);
    if (ok) { message.success("ลบรีวิวสำเร็จ"); navigate(`/game/${gameId}`); }
    else { message.error("ลบไม่สำเร็จ"); }
  };

  return (
    <div>
      <div style={{
        background: "linear-gradient(90deg, #9254de 0%, #f759ab 100%)",
        height: 120, borderRadius: 10, marginBottom: 24
      }} />
      <Card style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Title level={3} style={{ color: "white", margin: 0 }}>
            {isEdit ? "Edit Review" : "Create Review"}
          </Title>
          <Paragraph style={{ color: "#ddd" }}>
            {isEdit ? "แก้ไขรีวิวของคุณสำหรับ" : "เขียนรีวิวสำหรับ"}{" "}
            <span style={{ color: "#fff", fontWeight: 600 }}>{gameTitle}</span>
          </Paragraph>

          <Form form={form} layout="vertical" requiredMark={false}>
            {/* ✅ Title */}
            <Form.Item
              name="title"
              label={<span style={{ color: "#ccc" }}>Title</span>}
              rules={[
                { required: true, message: "กรอกหัวข้อรีวิวด้วยครับ" },
                { min: 4, message: "อย่างน้อย 4 ตัวอักษร" },
              ]}
            >
              <Input placeholder="เช่น สนุกมาก ระบบต่อสู้ดุดัน แต่ performance สะดุด" />
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
              <TextArea rows={5} placeholder="บอกเล่าประสบการณ์ ความเห็น จุดเด่น/ด้อย ฯลฯ" />
            </Form.Item>

            <Space>
              <Button type="primary" loading={loading} onClick={handleSubmit}>
                {isEdit ? "Update Review" : "Submit Review"}
              </Button>
              <Button onClick={() => navigate(`/game/${gameId}`)}>Cancel</Button>
              {isEdit && (
                <Popconfirm
                  title="ลบรีวิว?"
                  okText="ลบ" cancelText="ยกเลิก"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleDelete}
                >
                  <Button danger>Delete</Button>
                </Popconfirm>
              )}
            </Space>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
