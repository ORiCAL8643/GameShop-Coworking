import { useEffect, useMemo, useState, useCallback } from "react";
import { message, Space, Select } from "antd";
import axios from "axios";
import ThreadList from "./ThreadList";
import ThreadDetail from "./ThreadDetail";
import type { Thread, ThreadComment } from "./types";
import { useAuth } from "../../context/AuthContext";

const base_url = "http://localhost:8088";

export default function CommunityPage() {
  const { id: user_id } = useAuth();

  const [threads, setThreads] = useState<Thread[]>([]);
  type Game = { ID: number; game_name: string; status: string };
  type ServerThread = {
    ID: number;
    title: string;
    content: string;
    user?: { username?: string };
    CreatedAt?: string;
    likes: number;
    comments: number;
  };
  type ServerComment = {
    ID: number;
    content: string;
    user?: { username?: string };
    CreatedAt?: string;
    parent_comment_id?: number | null;
  };
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'likes' | 'comments'>(
    'latest'
  );

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  useEffect(() => {
    axios.get(`${base_url}/game`).then((res) => {
      const approved = (res.data as Game[]).filter((g) => g.status === 'approve');
      setGames(approved);
      if (approved.length) {
        setSelectedGameId(approved[0].ID);
      }
    });
  }, []);

  const fetchThreads = useCallback(() => {
    if (!selectedGameId) return;
    axios
      .get(`${base_url}/threads`, { params: { sort: sortBy, game_id: selectedGameId } })
      .then((res) => {
        const data = (res.data as ServerThread[]).map((t) => ({
          id: t.ID,
          title: t.title,
          body: t.content,
          author: t.user?.username || '',
          createdAt: t.CreatedAt || '',
          likes: t.likes,
          commentCount: t.comments,
          comments: [],
        }));
        setThreads(data);
      })
      .catch(() => {});
  }, [selectedGameId, sortBy]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = ({ title, body }: { title: string; body: string; images?: string[] }) => {
    if (!user_id || !selectedGameId) {
      message.error('กรุณาเลือกเกมและเข้าสู่ระบบ');
      return;
    }
    axios
      .post(`${base_url}/threads`, {
        title,
        content: body,
        user_id,
        game_id: selectedGameId,
      })
      .then(() => {
        message.success('สร้างเธรดใหม่แล้ว');
        fetchThreads();
      })
      .catch(() => message.error('ไม่สามารถสร้างเธรดได้'));
  };

  const fetchComments = useCallback((threadId: number) => {
    axios
      .get(`${base_url}/comments`, { params: { thread_id: threadId } })
      .then((res) => {
        const data: ThreadComment[] = (res.data as ServerComment[])
          .filter((c) => c.parent_comment_id == null)
          .map((c) => ({
            id: c.ID,
            author: c.user?.username || '',
            content: c.content,
            datetime: c.CreatedAt || '',
          }));
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? { ...t, comments: data, commentCount: data.length }
              : t
          )
        );
      });
  }, []);

  const openThread = (id: number) => {
    setActiveId(id);
    fetchComments(id);
  };

  const replyRoot = ({ content }: { content: string }) => {
    if (!activeThread || !user_id) return;
    axios
      .post(`${base_url}/comments`, {
        thread_id: activeThread.id,
        user_id,
        content,
      })
      .then(() => {
        fetchComments(activeThread.id);
        message.success('ตอบกลับแล้ว');
      })
      .catch(() => message.error('ไม่สามารถตอบกลับได้'));
  };

  return (
    <div style={{ minHeight: '100vh', padding: 24, flex: 1, background: '#1e1e2f' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
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
                  value={selectedGameId ?? undefined}
                  onChange={(v) => setSelectedGameId(v)}
                  style={{ width: 200 }}
                  options={games.map((g) => ({ value: g.ID, label: g.game_name }))}
                />
              <Select
                value={sortBy}
                onChange={(v) => setSortBy(v)}
                style={{ width: 200 }}
                options={[
                  { value: 'latest', label: 'Latest' },
                  { value: 'likes', label: 'Likes' },
                  { value: 'comments', label: 'Comments' },
                ]}
              />
            </Space>
            <ThreadList
              threads={threads}
              sortBy={sortBy}
              onOpen={openThread}
              onCreate={createThread}
            />
          </>
        )}
      </Space>
    </div>
  );
}
