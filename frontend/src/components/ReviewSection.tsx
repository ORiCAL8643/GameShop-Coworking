import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar, Button, ConfigProvider, Form, Input, List, Modal,
  Popconfirm, Rate, Space, message, theme
} from "antd";
import { Heart, Pencil, Trash2, Plus } from "lucide-react";
import { UserOutlined } from "@ant-design/icons";
import axios from "axios";

import { ReviewsAPI, type ReviewItem } from "../services/reviews";
import { useAuth } from "../context/AuthContext";

/** ===== config ===== */
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8088";

export type ReviewSectionProps = {
  gameId: number;
  allowCreate?: boolean;
  className?: string;
  onStatsChange?: (stats: { count: number; average: number }) => void;
};

/** ให้ rating เป็นจำนวนเต็ม 1–5 */
const clampIntRating = (v: unknown) => {
  const n = Math.round(Number(v || 0));
  if (Number.isNaN(n)) return 1;
  return Math.min(5, Math.max(1, n));
};

/** ดึงชื่อจาก user id (ลองหลาย field ตามที่ backend อาจใช้) */
async function fetchUsernameById(id: number) {
  try {
    const { data } = await axios.get(`${BASE}/users/${id}`);
    const name =
      data?.username ||
      data?.name ||
      data?.display_name ||
      (typeof data?.email === "string" ? data.email.split("@")[0] : undefined);
    return name as string | undefined;
  } catch {
    return undefined;
  }
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  gameId,
  allowCreate = true,
  className,
  onStatsChange,
}) => {
  const { id: authId, token } = useAuth();
  const userId = authId ? Number(authId) : undefined;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ReviewItem | null>(null);
  const [form] = Form.useForm<{ title?: string; content: string; rating: number }>();
  const [owned, setOwned] = useState(false);

  const avgRating = useMemo(
    () =>
      items.length
        ? items.reduce((s, r) => s + clampIntRating(r.rating), 0) / items.length
        : 0,
    [items]
  );
  useEffect(() => {
    onStatsChange?.({ count: items.length, average: avgRating });
  }, [items, avgRating, onStatsChange]);

  /** ------- โหลดรีวิว + เติมชื่อผู้ใช้ -------- */
  const load = async () => {
    try {
      setLoading(true);

      const list = await ReviewsAPI.listByGame(gameId, token || undefined);
      let normalized = (list || []).map((r) => ({
        ...r,
        rating: clampIntRating(r.rating),
        likes: typeof r.likes === "number" ? r.likes : 0,
        likedByMe: typeof r.likedByMe === "boolean" ? r.likedByMe : false,
      }));

      // sort ล่าสุดขึ้นก่อน
      normalized.sort((a, b) => (b.UpdatedAt || "").localeCompare(a.UpdatedAt || ""));

      // หากมีรีวิวของผู้ใช้เอง ให้ย้ายขึ้นมาไว้ด้านบนสุด
      if (typeof userId === "number") {
        const myIndex = normalized.findIndex((r) => r.user_id === userId);
        if (myIndex >= 0) {
          const [mine] = normalized.splice(myIndex, 1);
          normalized.unshift(mine);
        }
      }

      // หา user_id ที่ยังไม่มี username แล้วดึงชื่อมาเติม
      const missingIds = Array.from(
        new Set(
          normalized
            .filter((r) => !r.username && typeof r.user_id === "number")
            .map((r) => r.user_id as number)
        )
      );

      if (missingIds.length) {
        const pairs = await Promise.all(
          missingIds.map(async (id) => [id, await fetchUsernameById(id)] as const)
        );
        const nameMap = Object.fromEntries(pairs.filter(([, name]) => !!name)) as Record<number, string>;

        if (Object.keys(nameMap).length) {
          normalized = normalized.map((r) =>
            r.username || !nameMap[r.user_id as number]
              ? r
              : { ...r, username: nameMap[r.user_id as number] }
          );
        }
      }

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
  useEffect(() => {
    const checkOwned = async () => {
      if (!userId) {
        setOwned(false);
        return;
      }
      try {
        const { data } = await axios.get(
          `${BASE}/user-games?user_id=${userId}&game_id=${gameId}`
        );
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setOwned(false);
        } else {
          setOwned(true);
        }
      } catch {
        setOwned(false);
      }
    };
    checkOwned();
  }, [userId, gameId]);

  /** ------- actions ------- */
  const canCreate = allowCreate && !!userId && owned;

  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ rating: 5 });
    setShowForm(true);
  };

  const onEdit = (r: ReviewItem) => {
    setEditing(r);
    form.setFieldsValue({
      title: r.title,
      content: r.content,
      rating: clampIntRating(r.rating),
    });
    setShowForm(true);
  };

  const onDelete = async (r: ReviewItem) => {
    try {
      await ReviewsAPI.remove(r.ID, token || undefined);
      setItems((prev) => prev.filter((it) => it.ID !== r.ID));
      message.success("ลบรีวิวแล้ว");
    } catch {
      message.error("ลบรีวิวไม่สำเร็จ");
    }
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const rating = clampIntRating(values.rating);

      if (editing) {
        const saved = await ReviewsAPI.updateJson(
          editing.ID,
          {
            game_id: editing.game_id,
            user_id: editing.user_id,
            review_title: values.title,
            review_text: values.content,
            rating,
          },
          token || undefined
        );
        setItems((prev) => {
          const updated = prev.map((it) =>
            it.ID === editing.ID ? { ...it, ...saved, rating } : it
          );
          if (typeof userId === "number") {
            const myIndex = updated.findIndex((r) => r.user_id === userId);
            if (myIndex >= 0) {
              const [mine] = updated.splice(myIndex, 1);
              updated.unshift(mine);
            }
          }
          return updated;
        });
        message.success("อัปเดตรีวิวแล้ว");
      } else {
        if (!userId) {
          message.info("กรุณาเข้าสู่ระบบ");
          return;
        }
        try {
          const created = await ReviewsAPI.createJson(
            {
              game_id: gameId,
              user_id: userId,
              review_title: values.title,
              review_text: values.content,
              rating,
            },
            token || undefined
          );

          // เติมชื่อทันทีหลังสร้าง (ถ้าคุณมีชื่อใน auth context ใส่แทน created.username ได้)
          const createdWithName = { ...created } as ReviewItem;
          if (!createdWithName.username) {
            createdWithName.username = await fetchUsernameById(userId);
          }

          setItems((prev) => [createdWithName, ...prev]);
          message.success("สร้างรีวิวแล้ว");
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 403) {
            message.error("ยังไม่ได้เป็นเจ้าของเกม");
          } else {
            message.error("สร้างรีวิวไม่สำเร็จ");
          }
          return;
        }
      }

      setShowForm(false);
      setEditing(null);
      form.resetFields();
    } catch {
      /* antd handle validation */
    }
  };

  /** ------- like (optimistic) ------- */
  const handleToggleLike = (r: ReviewItem) => {
    if (!userId) {
      message.info("กรุณาเข้าสู่ระบบเพื่อกดถูกใจ");
      return;
    }
    const latest = items.find((it) => it.ID === r.ID);
    const alreadyLiked = !!latest?.likedByMe;
    const currentLikes = latest?.likes ?? 0;

    setItems((prev) =>
      prev.map((it) =>
        it.ID === r.ID
          ? { ...it, likedByMe: !alreadyLiked, likes: Math.max(0, currentLikes + (alreadyLiked ? -1 : 1)) }
          : it
      )
    );

    ReviewsAPI.toggleLike(r.ID, userId, token || undefined).catch(() => {
      // rollback
      setItems((prev) =>
        prev.map((it) =>
          it.ID === r.ID ? { ...it, likedByMe: alreadyLiked, likes: Math.max(0, currentLikes) } : it
        )
      );
      message.error("ไม่สามารถกดถูกใจได้");
    });
  };

  /** ------- header ------- */
  const header = useMemo(
    () => (
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>รีวิวทั้งหมด ({items.length})</h3>
        {canCreate && (
          <Button type="primary" icon={<Plus size={16} />} onClick={onCreate}>
            สร้างรีวิว
          </Button>
        )}
      </Space>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canCreate, items.length]
  );

  return (
    <div className={className}>
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <List
          className="bg-[#1a1a1a] rounded-xl p-4"
          header={header}
          loading={loading}
          dataSource={items}
          itemLayout="vertical"
          renderItem={(r) => (
            <List.Item
              key={r.ID}
              actions={[
                <Space key="like" onClick={() => handleToggleLike(r)} style={{ cursor: "pointer" }}>
                  <Heart
                    size={18}
                    fill={r.likedByMe ? "currentColor" : "none"}
                    className={r.likedByMe ? "text-red-400" : "text-gray-500"}
                  />
                  <span>{r.likes ?? 0}</span>
                </Space>,
                userId === r.user_id ? (
                  <Space key="edit-del">
                    <Button size="small" icon={<Pencil size={14} />} onClick={() => onEdit(r)}>
                      แก้ไข
                    </Button>
                    <Popconfirm title="ลบรีวิวนี้?" okText="ลบ" cancelText="ยกเลิก" onConfirm={() => onDelete(r)}>
                      <Button size="small" danger icon={<Trash2 size={14} />}>
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
                    <Rate disabled value={clampIntRating(r.rating)} allowHalf={false} />
                  </Space>
                }
                description={
                  <span style={{ color: "#888" }}>
                    {/* ✅ ใช้ชื่อจริงแทน user_id ถ้ามี */}
                    โดย <span style={{ color: "#bbb" }}>{r.username || `user#${r.user_id}`}</span> ·{" "}
                    {new Date(r.UpdatedAt || r.CreatedAt || Date.now()).toLocaleString()}
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
          styles={{ body: { background: "#1a1a1a", color: "#fff" } }}
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
          destroyOnHidden
        >
          <Form layout="vertical" form={form} initialValues={{ rating: 5 }}>
            <Form.Item label="หัวข้อ" name="title">
              <Input placeholder="เช่น เกมสนุกเกินคาด!" maxLength={120} />
            </Form.Item>
            <Form.Item
              label="รายละเอียด"
              name="content"
              rules={[{ required: true, message: "กรุณากรอกรายละเอียด" }]}
            >
              <Input.TextArea rows={5} placeholder="เล่าประสบการณ์ของคุณ" />
            </Form.Item>
            <Form.Item
              label="ให้คะแนน"
              name="rating"
              getValueFromEvent={(v) => clampIntRating(v)}
              rules={[
                { required: true, message: "กรุณาให้คะแนน" },
                {
                  validator: (_, v) =>
                    Number.isInteger(v) && v >= 1 && v <= 5
                      ? Promise.resolve()
                      : Promise.reject("ให้คะแนนเป็นจำนวนเต็ม 1–5 เท่านั้น"),
                },
              ]}
            >
              <Rate allowHalf={false} allowClear={false} />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default ReviewSection;
