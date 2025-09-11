import React, { useEffect, useMemo, useState } from "react";
import { Avatar, Button, ConfigProvider, Form, Input, List, Modal, Popconfirm, Rate, Space, message, theme } from "antd";
import { Heart, Pencil, Trash2, Plus } from "lucide-react";
import { UserOutlined } from "@ant-design/icons";

import { ReviewsAPI, type ReviewItem } from "../services/reviews";
// ใช้ context จริงของโปรเจกต์คุณ (ต้องมี id, username, token)
import { useAuth } from "../context/AuthContext";

export type ReviewSectionProps = {
  gameId: number;
  allowCreate?: boolean;
  className?: string;
};

const ReviewSection: React.FC<ReviewSectionProps> = ({ gameId, allowCreate = true, className }) => {
  const { id: authId, token } = useAuth();
  const userId = authId ? Number(authId) : undefined;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ReviewItem | null>(null);
  const [form] = Form.useForm<{ title?: string; content: string; rating: number }>();

  // โหลดรีวิวของเกม
  const load = async () => {
    try {
      setLoading(true);
      const list = await ReviewsAPI.listByGame(gameId, token || undefined);
      const normalized = (list || []).map(r => ({
        ...r,
        likes: typeof r.likes === "number" ? r.likes : 0,
        likedByMe: typeof r.likedByMe === "boolean" ? r.likedByMe : false,
      }));
      normalized.sort((a, b) => (b.UpdatedAt || "").localeCompare(a.UpdatedAt || ""));
      setItems(normalized);
    } catch {
      message.error("โหลดรีวิวไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const canCreate = allowCreate && !!userId;

  const onCreate = React.useCallback(() => {
    setEditing(null);
    form.resetFields();
    setShowForm(true);
  }, [form]);

  const onEdit = (r: ReviewItem) => {
    setEditing(r);
    form.setFieldsValue({
      title: r.title,
      content: r.content,
      rating: r.rating,
    });
    setShowForm(true);
  };

  const onDelete = async (r: ReviewItem) => {
    try {
      await ReviewsAPI.remove(r.ID, token || undefined);
      setItems(prev => prev.filter(it => it.ID !== r.ID));
      message.success("ลบรีวิวแล้ว");
    } catch {
      message.error("ลบรีวิวไม่สำเร็จ");
    }
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editing) {
        const saved = await ReviewsAPI.updateJson(
          editing.ID,
          {
            game_id: editing.game_id,
            user_id: editing.user_id,
            review_title: values.title,
            review_text: values.content,
            rating: values.rating,
          },
          token || undefined
        );
        setItems(prev => prev.map(it => (it.ID === editing.ID ? { ...it, ...saved } : it)));
        message.success("อัปเดตรีวิวแล้ว");
      } else {
        if (!userId) {
          message.info("กรุณาเข้าสู่ระบบ");
          return;
        }
        const created = await ReviewsAPI.createJson(
          {
            game_id: gameId,
            user_id: userId,
            review_title: values.title,
            review_text: values.content,
            rating: values.rating,
          },
          token || undefined
        );
        setItems(prev => [created, ...prev]);
        message.success("สร้างรีวิวแล้ว");
      }

      setShowForm(false);
      setEditing(null);
      form.resetFields();
    } catch {
      // antd จะจัดการ message validation ให้เอง
    }
  };

  // อ่านสถานะล่าสุดจาก state ก่อน toggle (กันค่า stale)
  const handleToggleLike = (r: ReviewItem) => {
    if (!userId) {
      message.info("กรุณาเข้าสู่ระบบเพื่อกดถูกใจ");
      return;
    }
    const latest = items.find(it => it.ID === r.ID);
    const alreadyLiked = !!latest?.likedByMe;
    const currentLikes = latest?.likes ?? 0;

    // optimistic update
    setItems(prev =>
      prev.map(it =>
        it.ID === r.ID
          ? { ...it, likedByMe: !alreadyLiked, likes: Math.max(0, currentLikes + (alreadyLiked ? -1 : 1)) }
          : it
      )
    );

    ReviewsAPI.toggleLike(r.ID, userId, token || undefined)
      .then(res => {
        setItems(prev =>
          prev.map(it =>
            it.ID === r.ID
              ? {
                  ...it,
                  likes: typeof res.likes === "number" ? res.likes : it.likes,
                  // บาง backend อาจคืน liked มาด้วย
                  ...(typeof res.liked === "boolean" ? { likedByMe: res.liked } : {}),
                }
              : it
          )
        );
      })
      .catch(() => {
        // rollback
        setItems(prev =>
          prev.map(it =>
            it.ID === r.ID ? { ...it, likedByMe: alreadyLiked, likes: Math.max(0, currentLikes) } : it
          )
        );
        message.error("ไม่สามารถกดถูกใจได้");
      });
  };

  const header = useMemo(
    () => (
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>รีวิวทั้งหมด</h3>
        {canCreate && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={onCreate}
            className="bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
          >
            สร้างรีวิว
          </Button>
        )}
      </Space>
    ),
    [canCreate, onCreate]
  );

  return (
    <div className={className}>
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <List
          className="bg-[#1a1a1a]"
          header={header}
          loading={loading}
          dataSource={items}
          itemLayout="vertical"
          renderItem={(r) => (
            <List.Item
              key={r.ID}
              className="bg-[#1a1a1a]"
              actions={[
                <Space key="like" onClick={() => handleToggleLike(r)} style={{ cursor: "pointer" }}>
                  <Heart size={18} style={{ verticalAlign: "middle" }} className={r.likedByMe ? "text-red-500" : "text-gray-400"} />
                  <span>{r.likes ?? 0}</span>
                </Space>,
                userId === r.user_id ? (
                  <Space key="edit-del">
                    <Button
                      size="small"
                      icon={<Pencil size={14} />}
                      onClick={() => onEdit(r)}
                      className="bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
                    >
                      แก้ไข
                    </Button>
                    <Popconfirm
                      title="ลบรีวิวนี้?"
                      okText="ลบ"
                      cancelText="ยกเลิก"
                      onConfirm={() => onDelete(r)}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<Trash2 size={14} />}
                        className="bg-red-800 text-white border border-gray-600 hover:bg-red-700"
                      >
                        ลบ
                      </Button>
                    </Popconfirm>
                  </Space>
                ) : null,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space>
                    <strong>{r.title || "ไม่มีหัวข้อ"}</strong>
                    <Rate allowHalf disabled value={Number(r.rating) || 0} />
                  </Space>
                }
                description={
                  <span style={{ color: "#888" }}>
                    โดย {r.username || `user#${r.user_id}`} · {new Date(r.UpdatedAt || r.CreatedAt || Date.now()).toLocaleString()}
                  </span>
                }
              />
              <div style={{ whiteSpace: "pre-wrap" }}>{r.content}</div>
            </List.Item>
          )}
        />
      </ConfigProvider>

      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <Modal
          className="bg-[#1a1a1a] text-white"
          style={{ background: "#1a1a1a", color: "#fff" }}
          bodyStyle={{ background: "#1a1a1a", color: "#fff" }}
          open={showForm}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
            form.resetFields();
          }}
          onOk={onSubmit}
          okText={editing ? "บันทึก" : "สร้าง"}
          cancelText="ยกเลิก"
          title={editing ? "แก้ไขรีวิว" : "สร้างรีวิว"}
          destroyOnClose
          okButtonProps={{ className: "bg-blue-600 text-white border border-gray-600 hover:bg-blue-500" }}
          cancelButtonProps={{ className: "bg-gray-700 text-white border border-gray-600 hover:bg-gray-600" }}
        >
          <Form layout="vertical" form={form} initialValues={{ rating: 0 }}>
            <Form.Item label="หัวข้อ" name="title">
              <Input
                placeholder="เช่น เกมสนุกเกินคาด!"
                maxLength={120}
                className="bg-[#333] text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500"
              />
            </Form.Item>
            <Form.Item label="รายละเอียด" name="content" rules={[{ required: true, message: "กรุณากรอกรายละเอียด" }]}>
              <Input.TextArea
                rows={5}
                placeholder="เล่าประสบการณ์ของคุณ"
                className="bg-[#333] text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500"
              />
            </Form.Item>
            <Form.Item label="ให้คะแนน" name="rating" rules={[{ required: true }]}>
              <Rate allowHalf className="text-yellow-400" />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default ReviewSection;
