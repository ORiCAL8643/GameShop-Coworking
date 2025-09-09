import { useEffect, useMemo, useState } from "react";
import { message, Space, Select } from "antd";
import axios from "axios";
import ThreadList from "./ThreadList";
import ThreadDetail from "./ThreadDetail";
import type { Thread, ThreadComment } from "./types";
import { useAuth } from "../../context/AuthContext";

const base_url = "http://localhost:8088";

export default function CommunityPage() {
  const { id: userId } = useAuth();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [games, setGames] = useState<{ id: number; name: string }[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'likes' | 'comments'>('latest');

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  const buildCommentTree = (items: any[]): ThreadComment[] => {
    const map = new Map<number, ThreadComment & { parentId?: number }>();
    const roots: ThreadComment[] = [];
    items.forEach((c: any) => {
      map.set(c.ID, {
        id: c.ID,
        author: c.user?.username || "",
        content: c.content,
        datetime: c.CreatedAt || "",
        children: [],
        parentId: c.parent_comment_id,
      });
    });
    map.forEach((item) => {
      if (item.parentId) {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(item);
        } else {
          roots.push(item);
        }
      } else {
        roots.push(item);
      }
      delete (item as any).parentId;
    });
    return roots;
  };

  const countComments = (arr: ThreadComment[]): number =>
    arr.reduce(
      (sum, c) => sum + 1 + (c.children ? countComments(c.children) : 0),
      0
    );

  const fetchComments = (threadId: number) => {
    axios
      .get(`${base_url}/comments`, { params: { thread_id: threadId } })
      .then((res) => {
        const tree = buildCommentTree(res.data);
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? { ...t, comments: tree, commentCount: countComments(tree) }
              : t
          )
        );
      })
      .catch(() => {});
  };

  const fetchThreads = () => {
    if (!selectedGameId) {
      setThreads([]);
      return;
    }
    axios
      .get(`${base_url}/threads`, {
        params: { game_id: selectedGameId, sort: sortBy },
      })
      .then((res) => {
        const data = res.data.map((t: any) => ({
          id: t.ID,
          title: t.title,
          body: t.content,
          author: t.user?.username || "",
          createdAt: t.CreatedAt || "",
          likes: t.likes,
          commentCount: t.comments,
          comments: [],
        })) as Thread[];
        setThreads(data);
      })
      .catch(() => {});
  };

  const createThread = async ({ title, body }: { title: string; body: string; images?: string[] }) => {
    if (!userId || !selectedGameId) {
      message.error("กรุณาเลือกเกมก่อนโพสต์");
      return;
    }
    try {
      await axios.post(`${base_url}/threads`, {
        title,
        content: body,
        user_id: userId,
        game_id: selectedGameId,
      });
      message.success("สร้างเธรดใหม่แล้ว");
      fetchThreads();
    } catch {
      message.error("สร้างเธรดล้มเหลว");
    }
  };

  const replyRoot = async ({ content }: { content: string }) => {
    if (!activeThread || !userId) return;
    try {
      await axios.post(`${base_url}/comments`, {
        thread_id: activeThread.id,
        user_id: userId,
        content,
      });
      message.success("ตอบกลับแล้ว");
      fetchComments(activeThread.id);
    } catch {
      message.error("ตอบกลับล้มเหลว");
    }
  };

  useEffect(() => {
    axios
      .get(`${base_url}/game`)
      .then((res) => {
        const gs = res.data
          .filter((g: any) => g.status === "approve")
          .map((g: any) => ({ id: g.ID, name: g.game_name }));
        setGames(gs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [selectedGameId, sortBy]);

  useEffect(() => {
    if (activeId != null) fetchComments(activeId);
  }, [activeId]);

  return (
    <div style={{minHeight:'100vh', padding: 24 , flex: 1 , background: "#1e1e2f"}}>
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {activeThread ? (
        <ThreadDetail
          thread={activeThread}
          onBack={() => setActiveId(null)}
          onReplyRoot={replyRoot}
        />
      ) : (
        <>
          <Space>
            <Select
              placeholder="เลือกเกม"
              value={selectedGameId ?? undefined}
              onChange={(v) => setSelectedGameId(v)}
              style={{ width: 200 }}
              options={games.map((g) => ({ value: g.id, label: g.name }))}
            />
            <Select
              value={sortBy}
              onChange={(v) => setSortBy(v)}
              style={{ width: 200 }}
              options={[
                { value: 'latest', label: 'Latest' },
                { value: 'likes', label: 'Likes' },
                { value: 'comments', label: 'Comments' }
              ]}
            />
          </Space>
          <ThreadList
            threads={threads}
            sortBy={sortBy}
            onOpen={(id) => setActiveId(id)}
            onCreate={createThread}
          />
        </>
      )}
    </Space>
    </div>
  );
}
