import { useEffect, useState } from "react";
import { Avatar, Badge, Button, Card, Input, Modal, Space, Typography, message } from "antd";
import { ArrowLeftOutlined, LikeFilled, LikeOutlined, MessageOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";

// ปรับ path ให้ตรงกับโปรเจกต์
import { useAuth } from '../../context/AuthContext';

type ThreadImg = { id: number; url: string };
type Thread = {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  images: ThreadImg[];
};
export type ThreadComment = {
  id: number;
  content: string;
  userName: string;
  createdAt: string;
};

const { Title, Text } = Typography;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8088";
const DEV_USER_ID = Number(import.meta.env.VITE_DEV_USER_ID || 0);

function authHeaders(token?: string | null, uid?: number | string | null) {
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  if (!h["Authorization"]) {
    const id = uid ?? (DEV_USER_ID || null);
    if (id) h["X-User-ID"] = String(id);
  }
  return h;
}

type Props = {
  threadId: number;
  onBack: () => void;
};

export default function ThreadDetail({ threadId, onBack }: Props) {
  const { id: authId, token } = useAuth() as { id?: number; token?: string };
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  const load = async () => {
    try {
      const th = await axios.get(`${BASE_URL}/threads/${threadId}`, {
        headers: authHeaders(token, authId),
      });
      const t = th.data;
      const mapped: Thread = {
        id: t.id ?? t.ID,
        title: t.title ?? t.Title ?? "",
        content: t.content ?? t.Content ?? "",
        author: t.user?.username ?? t.User?.Username ?? "",
        createdAt: t.posted_at ?? t.PostedAt ?? t.created_at ?? t.CreatedAt ?? "",
        likeCount: t.like_count ?? t.LikeCount ?? 0,
        commentCount: t.comment_count ?? t.CommentCount ?? 0,
        images: (t.images || t.ThreadImages || []).map((img: any) => ({
          id: img.id ?? img.ID,
          url: (img.file_url ?? img.FileURL ?? "").startsWith("/")
            ? BASE_URL + (img.file_url ?? img.FileURL)
            : (img.file_url ?? img.FileURL ?? ""),
        })),
      };
      setThread(mapped);
      setLiked(!!(t.liked ?? t.Liked));

      const cm = await axios.get(`${BASE_URL}/threads/${threadId}/comments?limit=200&offset=0`);
      const rows: ThreadComment[] = (cm.data || []).map((c: any) => ({
        id: c.id ?? c.ID,
        content: c.content ?? c.Content ?? "",
        userName: c.user?.username ?? c.User?.Username ?? "",
        createdAt: c.created_at ?? c.CreatedAt ?? "",
      }));
      rows.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
      setComments(rows);
    } catch (e) {
      console.error(e);
      message.error("โหลดรายละเอียดเธรดไม่สำเร็จ");
    }
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [threadId]);

  const canSend = text.trim().length > 0;

  const sendComment = async () => {
    if (!token && !authId && !DEV_USER_ID) {
      return message.error("ต้องเข้าสู่ระบบก่อนจึงจะคอมเมนต์ได้");
    }
    try {
      await axios.post(
        `${BASE_URL}/threads/${threadId}/comments`,
        { content: text.trim() },
        { headers: authHeaders(token, authId) }
      );
      setText("");
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message;
      message.error("ส่งคอมเมนต์ไม่สำเร็จ: " + (msg || ""));
      console.error(e);
    }
  };

  const toggleLike = async () => {
    if (!token && !authId && !DEV_USER_ID) {
      return message.error("ต้องเข้าสู่ระบบก่อนจึงจะกดถูกใจได้");
    }
    try {
      const res = await axios.post(`${BASE_URL}/threads/${threadId}/toggle_like`, null, {
        headers: authHeaders(token, authId),
      });
      const liked = !!res.data?.liked;
      setLiked(liked);
      setThread((prev) =>
        prev ? { ...prev, likeCount: Math.max(0, prev.likeCount + (liked ? 1 : -1)) } : prev
      );
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message;
      message.error("กดถูกใจไม่สำเร็จ: " + (msg || ""));
      console.error(e);
    }
  };

  if (!thread) {
    return (
      <Card styles={{ body: { padding: 24, background: "#121723" } }} style={{ background: "#121723", border: "1px solid #1f2942", borderRadius: 14 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>ย้อนกลับ</Button>
        <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>กำลังโหลด…</div>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Button icon={<ArrowLeftOutlined />} onClick={onBack}>ย้อนกลับ</Button>

      <Card styles={{ body: { padding: 24, background: "#121723" } }} style={{ background: "#121723", border: "1px solid #1f2942", borderRadius: 14 }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Title level={3} style={{ color: "#e6e6e6", margin: 0 }}>{thread.title}</Title>
          <Text style={{ color: "#a8b3cf" }}>{thread.content}</Text>

          {!!thread.images?.length && (
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {thread.images.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  style={{ width: "100%", borderRadius: 12, border: "1px solid #1f2942" }}
                  onClick={() => setPreview(img.url)}
                />
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar icon={<UserOutlined />} />
              <Text style={{ color: "#93a0c2" }}>
                by {thread.author || "ไม่ระบุ"} · {thread.createdAt ? new Date(thread.createdAt).toLocaleString() : ""}
              </Text>
            </div>
            <Space>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Button
                  icon={liked ? <LikeFilled /> : <LikeOutlined />}
                  onClick={toggleLike}
                  shape="round"
                  type={liked ? "primary" : undefined}
                >
                  ถูกใจ
                </Button>
                <span style={{ color: "#a8b3cf" }}>{thread.likeCount}</span>
              </div>
              <Badge count={comments.length} size="small">
                <Button icon={<MessageOutlined />} shape="circle" />
              </Badge>
            </Space>
          </div>

          {/* คอมเมนต์แบบแถวเดียว */}
          <div style={{ marginTop: 8, padding: 12, border: "1px solid #1f2942", background: "#0f1420", borderRadius: 12 }}>
            {comments.length === 0 ? (
              <Text style={{ color: "#93a0c2" }}>ยังไม่มีความเห็น</Text>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <Avatar icon={<UserOutlined />} />
                  <div style={{ flex: 1 }}>
                    <div style={{ background: "#0c111b", border: "1px solid #1f2942", borderRadius: 10, padding: 10 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ color: "#e6e6e6", fontWeight: 500 }}>{c.userName || "ไม่ระบุ"}</span>
                        <span style={{ color: "#93a0c2", fontSize: 12 }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                        </span>
                      </div>
                      <div style={{ color: "#cfd7ef", marginTop: 6 }}>{c.content}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* กล่องส่งคอมเมนต์ */}
          <div style={{ display: "flex", gap: 10 }}>
            <Input.TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="พิมพ์คอมเมนต์… (Ctrl+Enter ส่ง)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (canSend) sendComment();
                }
              }}
              style={{ flex: 1, borderRadius: 8, background: "#0f1420", color: "#e6e6e6", borderColor: "#2a3655" }}
            />
            <Button type="primary" icon={<SendOutlined />} disabled={!canSend} onClick={sendComment}>
              ส่ง
            </Button>
          </div>
        </Space>
      </Card>

      <Modal open={!!preview} onCancel={() => setPreview(null)} footer={null} centered bodyStyle={{ padding: 0, background: "#000" }}>
        {preview && <img src={preview} style={{ width: "100%", display: "block" }} />}
      </Modal>
    </Space>
  );
}
