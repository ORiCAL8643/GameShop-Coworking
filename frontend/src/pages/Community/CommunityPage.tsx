import { useMemo, useRef, useState } from "react";
import { message, Space, Select } from "antd";
import ThreadList from "./ThreadList";
import ThreadDetail from "./ThreadDetail";
import type { Thread, ThreadComment } from "./types";

export default function CommunityPage() {
  // --- mock data เริ่มต้น ---
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: 1,
      title: "How high can we count before EA does something…?",
      body: "Rules: Just be respectful.",
      author: "neurougue",
      createdAt: "3 ชม.ที่แล้ว",
      likes: 2,
      comments: [
        { id: 11, author: "Yanis_zaky", content: "1", datetime: "3 ชม. @ 8:17am" },
        { id: 12, author: "MaT", content: "2", datetime: "3 ชม. @ 5:06pm" },
      ],
    },
    {
      id: 2,
      title: "For 1001st time MM is a joke",
      body: "…",
      author: "Sil Halcorrn",
      createdAt: "8 ชม.ที่แล้ว",
      likes: 1,
      comments: [],
    },
  ]);
  // --------------------------

  const idRef = useRef(1000);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'likes' | 'comments'>(
    'latest'
  );

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  const sortedThreads = useMemo(() => {
    const arr = [...threads];
    return arr.sort((a, b) => {
      if (sortBy === 'likes') return b.likes - a.likes;
      if (sortBy === 'comments')
        return b.comments.length - a.comments.length;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [threads, sortBy]);

  // สร้างเธรดใหม่ (หน้า List เท่านั้น)
    const createThread = ({ title, body, images }: { title: string; body: string; images?: string[] }) => {
      const n: Thread = {
        id: idRef.current++,
        title,
        body,
        author: "คุณ",
        createdAt: "เพิ่งโพสต์",
        likes: 0,
        comments: [],
        images, // ✅ เก็บรูปไปกับเธรด
      };
      setThreads((prev) => [n, ...prev]);
      message.success("สร้างเธรดใหม่แล้ว");
    };

  // เพิ่มคอมเมนต์ที่ระดับ root ของเธรดที่เปิดอยู่ (หน้า Detail เท่านั้น)
  const replyRoot = ({ content }: { content: string }) => {
    if (!activeThread) return;
    const newC: ThreadComment = {
      id: idRef.current++,
      author: "คุณ",
      content,
      datetime: "เพิ่งตอบกลับ",
    };
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, comments: [...t.comments, newC] } : t))
    );
    message.success("ตอบกลับแล้ว");
  };

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
          <ThreadList
            threads={sortedThreads}
            onOpen={(id) => setActiveId(id)}
            onCreate={createThread}
          />
        </>
      )}
    </Space>
    </div>
  );
}
