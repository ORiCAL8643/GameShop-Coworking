import { useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, Input, Modal, Space, Typography } from "antd";
import { ArrowLeftOutlined, LikeOutlined, MessageOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import CommentItem from "./CommentItem";
import type { Thread, ThreadComment, CreateReplyPayload } from "./types";

const { Title, Text } = Typography;

type Props = {
  thread: Thread;
  onBack: () => void;
  onReplyRoot: (payload: CreateReplyPayload) => void;
};

export default function ThreadDetail({ thread, onBack, onReplyRoot }: Props) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const canSend = text.trim().length > 0;

  const commentsCount = useMemo(
    () => {
      const dfs = (arr: ThreadComment[]): number =>
        arr.reduce((s, c) => s + 1 + (c.children?.length ? dfs(c.children) : 0), 0);
      return dfs(thread.comments || []);
    },
    [thread.comments]
  );

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Button icon={<ArrowLeftOutlined />} onClick={onBack}>ย้อนกลับ</Button>

      <Card style={{ background: "#1e1e1e", border: "1px solid #303030", borderRadius: 10 }} bodyStyle={{ padding: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Title level={3} style={{ color: "#fff", margin: 0 }}>{thread.title}</Title>
          <Text style={{ color: "#ccc" }}>{thread.body}</Text>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar icon={<UserOutlined />} />
              <Text style={{ color: "#aaa" }}>by {thread.author} · {thread.createdAt}</Text>
            </div>
            <Space>
              <Button icon={<LikeOutlined />} shape="circle" />
              <Badge count={commentsCount} size="small">
                <Button icon={<MessageOutlined />} shape="circle" />
              </Badge>
            </Space>
          </div>

          {/* โซนคอมเมนต์ */}
          <div style={{ marginTop: 8, padding: 12, border: "1px solid #303030", background: "#161616", borderRadius: 12 }}>
            {(thread.comments || []).map((c) => (
              <CommentItem
                key={c.id}
                data={c}
                onReply={(_, p) => onReplyRoot(p)} // เด้งไปให้ parent เพิ่มลง root ที่เหมาะสม
              />
            ))}
          </div>

          {/* กล่องตอบกลับ (ของเรา) */}
          {/* กล่องตอบกลับ (ของเรา) */}
<div className="dark-input" style={{ display: "flex", gap: 10 }}>
  <Input.TextArea
    value={text}
    onChange={(e) => setText(e.target.value)}
    autoSize={{ minRows: 2, maxRows: 6 }}
    placeholder="ตอบกลับในเธรดนี้… (Ctrl+Enter เพื่อส่ง)"  // ✅ placeholder จะเป็นสีขาวตาม CSS
    onKeyDown={(e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (canSend) onReplyRoot({ content: text.trim() }), setText("");
      }
    }}
    style={{ flex: 1, borderRadius: 8 }}
  />
  <Button
    type="primary"
    icon={<SendOutlined />}
    disabled={!canSend}
    onClick={() => {
      onReplyRoot({ content: text.trim() });
      setText("");
    }}
  >
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
