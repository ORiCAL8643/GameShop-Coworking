// CommunityPage.tsx
import { useEffect, useMemo, useState } from "react";
import { App, ConfigProvider, theme, message, Space, Select, Typography, Card } from "antd";
import axios from "axios";
import ThreadList from "./ThreadList";
import ThreadDetail from "./ThreadDetail";
import { useAuth } from "../../context/AuthContext";

type ThreadImg = { id: number; url: string };
export type Thread = {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  images: ThreadImg[];
};

const { Title, Text } = Typography;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8088";
const DEV_USER_ID = Number(import.meta.env.VITE_DEV_USER_ID || 0);

// ===== helpers =====
function mapThread(t: any): Thread {
  const imgs = (t.images || t.ThreadImages || []).map((img: any) => ({
    id: img.id ?? img.ID,
    url: (img.file_url ?? img.FileURL ?? "").startsWith("/")
      ? BASE_URL + (img.file_url ?? img.FileURL)
      : (img.file_url ?? img.FileURL ?? ""),
  }));
  return {
    id: t.id ?? t.ID,
    title: t.title ?? t.Title ?? "",
    content: t.content ?? t.Content ?? "",
    author: t.user?.username ?? t.User?.Username ?? "",
    createdAt: t.posted_at ?? t.PostedAt ?? t.created_at ?? t.CreatedAt ?? "",
    likeCount: t.like_count ?? t.LikeCount ?? 0,
    commentCount: t.comment_count ?? t.CommentCount ?? 0,
    images: imgs,
  };
}

function authHeaders(token?: string | null, uid?: number | string | null) {
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  if (uid != null && uid !== "") h["X-User-ID"] = String(uid);
  else if (!token && DEV_USER_ID) h["X-User-ID"] = String(DEV_USER_ID);
  return h;
}

export default function CommunityPage() {
  const { id: authId, token } = useAuth() as { id?: number; token?: string };

  const [games, setGames] = useState<{ id: number; name: string }[]>([]);
  const [gameId, setGameId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/game`);
        const list = (res.data || []).map((g: any) => ({
          id: g.id ?? g.ID,
          name: g.game_name ?? g.GameName ?? `Game #${g.id ?? g.ID}`,
        }));
        setGames(list);
        if (!gameId && list.length > 0) setGameId(list[0].id);
      } catch (e) {
        console.error(e);
        message.error("โหลดรายชื่อเกมไม่สำเร็จ");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadThreads = async (gid = gameId) => {
    if (!gid) return;
    try {
      const res = await axios.get(`${BASE_URL}/threads`, {
        params: { game_id: gid, limit: 100, offset: 0 },
      });
      setThreads((res.data || []).map(mapThread));
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.error || e.message || "โหลดเธรดไม่สำเร็จ");
    }
  };
  useEffect(() => { loadThreads(); /* eslint-disable-line */ }, [gameId]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  const createThread = async ({ title, content, files }: { title: string; content: string; files: File[] }) => {
    if (!(token || authId || DEV_USER_ID)) {
      message.error("กรุณาเข้าสู่ระบบก่อนโพสต์");
      return false;
    }
    if (!gameId) {
      message.warning("กรุณาเลือกเกมก่อน");
      return false;
    }
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("content", content);
      fd.append("game_id", String(gameId));
      files.forEach((f) => fd.append("images", f, f.name));
      await axios.post(`${BASE_URL}/threads`, fd, { headers: authHeaders(token, authId) });
      message.success("สร้างเธรดสำเร็จ");
      await loadThreads();
      return true;
    } catch (e: any) {
      console.error(e);
      message.error(e?.response?.data?.error || e.message || "สร้างเธรดไม่สำเร็จ");
      return false;
    }
  };

  // ==== เลย์เอาต์เต็มจอ ฝั่งขวา (เหลือเมนูซ้าย) ====
  const SIDEBAR_W = 220; // ปรับให้ตรงกับความกว้างแถบซ้ายของคุณ

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <App>
        {/* ใช้ fixed + เว้น left = width ของ sidebar เพื่อให้เต็มจริง ๆ */}
        <div
          style={{
            position: "fixed",
            left: SIDEBAR_W,
            right: 0,
            top: 0,
            bottom: 0,
            background: "#0b0e14",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              flex: "0 0 auto",
              background: "rgba(15,18,28,.85)",
              borderBottom: "1px solid #1f2942",
              width: "100%",
            }}
          >
            <div style={{ padding: "14px 24px", display: "flex", gap: 12, alignItems: "center", width: "100%" }}>
              <Title level={4} style={{ color: "#e6e6e6", margin: 0 }}>Community</Title>
              <div style={{ flex: 1 }} />
              <Text style={{ color: "#93a0c2" }}>
                {(token || authId || DEV_USER_ID) ? "พร้อมใช้งานสำหรับโพสต์/ถูกใจ" : "อ่านได้ แต่ยังโพสต์/ถูกใจไม่ได้ (ไม่มีตัวตน)"}
              </Text>
            </div>
          </div>

          {/* เนื้อหาเลื่อนภายใน */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ padding: 24, width: "100%", boxSizing: "border-box" }}>
              {activeThread ? (
                <ThreadDetail
                  threadId={activeThread.id}
                  onBack={async () => { setActiveId(null); await loadThreads(); }}
                />
              ) : (
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <Card
                    styles={{ body: { padding: 16, background: "#121723" } }}
                    style={{ background: "#121723", border: "1px solid #1f2942", borderRadius: 14, width: "100%" }}
                  >
                    <Space wrap>
                      <Text style={{ color: "#a8b3cf" }}>เลือกเกม:</Text>
                      <Select
                        value={gameId ?? undefined}
                        onChange={(v) => setGameId(v)}
                        options={games.map((g) => ({ value: g.id, label: g.name }))}
                        style={{ minWidth: 240 }}
                      />
                    </Space>
                  </Card>

                  <ThreadList
                    threads={threads}
                    sortBy="latest"
                    gameId={gameId}
                    onOpen={(id) => setActiveId(id)}
                    onCreate={({ title, body, files }) => createThread({ title, content: body, files })}
                  />
                </Space>
              )}
            </div>
          </div>
        </div>
      </App>
    </ConfigProvider>
  );
}
