import React, { useEffect, useMemo, useState } from "react";
import { ReviewsAPI, type Review } from "../services/reviews";
import { Avatar, Button, Form, Input, List, Modal, Popconfirm, Rate, Space, message } from "antd";
import {
  HeartOutlined,
  HeartFilled,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

export type ReviewSectionProps = {
  gameId: number;
  allowCreate?: boolean; // default true
  className?: string;
};

const ReviewSection: React.FC<ReviewSectionProps> = ({ gameId, allowCreate = true, className }) => {
  const { id, username } = useAuth();
  const userId = id;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<(Review & { likedByMe?: boolean })[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form] = Form.useForm<{ review_title: string; review_text?: string; rating: number }>();

  const canEdit = useMemo(() => (r: Review) => userId && r.user_id === Number(userId), [userId]);

  async function load() {
    setLoading(true);
    try {
      const list = await ReviewsAPI.listByGame(gameId);
      setItems(
        list
          .map(r => ({ ...r, likedByMe: false })) // ถ้า backend ส่งสถานะ liked มาได้ ค่อยอัปเดตส่วนนี้
          .sort((a, b) => (b.ID ?? 0) - (a.ID ?? 0))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      message.error(msg || "โหลดรีวิวไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [gameId]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ rating: 8 });
    setShowForm(true);
  }

  function openEdit(r: Review) {
    setEditing(r);
    form.setFieldsValue({
      review_title: r.review_title,
      review_text: r.review_text,
      rating: r.rating,
    });
    setShowForm(true);
  }

  async function handleSubmit() {
    const v = await form.validateFields();
    try {
      if (!userId) {
        message.warning("กรุณาเข้าสู่ระบบก่อนรีวิว");
        return;
      }
      if (editing) {
        const saved = await ReviewsAPI.update(editing.ID, {
          review_title: v.review_title,
          review_text: v.review_text,
          rating: v.rating,
        });
        setItems(prev => prev.map(it => (it.ID === editing.ID ? saved : it)));
        message.success("แก้ไขรีวิวแล้ว");
      } else {
        const saved = await ReviewsAPI.create({
          review_title: v.review_title,
          review_text: v.review_text,
          rating: v.rating,
          user_id: Number(userId),
          game_id: Number(gameId),
        });
        setItems(prev => [saved, ...prev]);
        message.success("สร้างรีวิวแล้ว");
      }
      setShowForm(false);
      setEditing(null);
      form.resetFields();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      message.error(msg || "บันทึกรีวิวไม่สำเร็จ");
    }
  }

  async function handleDelete(id: number) {
    try {
      await ReviewsAPI.remove(id);
      setItems(prev => prev.filter(it => it.ID !== id));
      message.success("ลบรีวิวแล้ว");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      message.error(msg || "ลบรีวิวไม่สำเร็จ");
    }
  }

  async function handleToggleLike(r: Review & { likedByMe?: boolean }) {
    if (!userId) {
      message.info("กรุณาเข้าสู่ระบบเพื่อกดถูกใจ");
      return;
    }
    const alreadyLiked = !!r.likedByMe;

    // optimistic update
    setItems(prev =>
      prev.map(it =>
        it.ID === r.ID
          ? {
              ...it,
              likedByMe: !alreadyLiked,
              likes: Math.max(0, (it.likes || 0) + (alreadyLiked ? -1 : 1)),
            }
          : it,
      ),
    );
    try {
      const res = await ReviewsAPI.toggleLike(r.ID, Number(userId));
      setItems(prev =>
        prev.map(it => (it.ID === r.ID ? { ...it, likes: res.likes } : it)),
      );
    } catch {
      // rollback
      setItems(prev =>
        prev.map(it =>
          it.ID === r.ID
            ? {
                ...it,
                likedByMe: alreadyLiked,
                likes: Math.max(0, (it.likes || 0) + (alreadyLiked ? 1 : -1)),
              }
            : it,
        ),
      );
    }
  }

  return (
    <div className={"w-full max-w-3xl mx-auto " + (className || "")}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">รีวิวจากผู้เล่น</h2>
        {allowCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            เขียนรีวิว
          </Button>
        )}
      </div>

      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: "ยังไม่มีรีวิวสำหรับเกมนี้" }}
        className="space-y-4"
        split={false}
        renderItem={(item) => {
          const initials = (item.user?.username || (item.user_id === userId && username) || "")
            .charAt(0)
            .toUpperCase();

          const actionButtons = [
            (
              <Button
                key="like"
                type="text"
                shape="round"
                onClick={() => handleToggleLike(item)}
                icon={item.likedByMe ? <HeartFilled /> : <HeartOutlined />}
              >
                {(item.likes ?? 0) > 0 ? item.likes : "ถูกใจ"}
              </Button>
            ),
            canEdit(item) && (
              <Button key="edit" type="text" shape="round" onClick={() => openEdit(item)} icon={<EditOutlined />}>
                แก้ไข
              </Button>
            ),
            canEdit(item) && (
              <Popconfirm key="del" title="ลบรีวิวนี้?" onConfirm={() => handleDelete(item.ID)}>
                <Button danger type="text" shape="round" icon={<DeleteOutlined />}>
                  ลบ
                </Button>
              </Popconfirm>
            ),
          ].filter(Boolean) as React.ReactNode[];

          return (
            <List.Item
              className="bg-white p-4 rounded-md shadow"
              actions={[<Space key="actions" size={8}>{actionButtons}</Space>]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={!initials && <UserOutlined />}>{initials || undefined}</Avatar>}
                title={
                  <Space align="center" size={8}>
                    <span className="font-medium">{item.review_title}</span>
                    <Rate disabled allowHalf value={item.rating / 2} />
                    <span className="text-xs text-gray-500">ให้ {item.rating}/10</span>
                  </Space>
                }
                description={
                  <div>
                    {item.review_text && <p className="text-sm text-gray-800 mb-1">{item.review_text}</p>}
                    <p className="text-xs text-gray-500">
                      โดย {item.user?.username || (item.user_id === userId && username) || `User#${item.user_id}`} · ID #{item.ID}
                    </p>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />

      <Modal
        title={editing ? "แก้ไขรีวิว" : "เขียนรีวิวใหม่"}
        open={showForm}
        onOk={handleSubmit}
        onCancel={() => { setShowForm(false); setEditing(null); }}
        okText={editing ? "บันทึก" : "สร้าง"}
        cancelText="ยกเลิก"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="หัวข้อ"
            name="review_title"
            rules={[{ required: true, message: "กรุณาใส่หัวข้อ" }]}
          >
            <Input maxLength={120} placeholder="สั้นๆ สรุปความรู้สึกต่อเกม" />
          </Form.Item>
          <Form.Item label="รายละเอียด" name="review_text">
            <Input.TextArea rows={4} maxLength={2000} placeholder="เล่าประสบการณ์ จุดเด่น จุดที่ควรปรับ" />
          </Form.Item>
          <Form.Item label="คะแนน (0-10)" name="rating" rules={[{ required: true }]}>
            <Rate allowHalf defaultValue={4} tooltips={["0","1","2","3","4","5","6","7","8","9","10"].map(x=>`${x}/10`)} />
            <div className="text-xs text-gray-500 mt-1">* แสดงเป็น 0–10 (ดาวจะคิดครึ่ง = /2)</div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewSection;
