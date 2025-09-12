import { useMemo, useState } from "react";
import { Button, Card, Input, Space, Typography, Upload } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import type { Thread } from "./CommunityPage";

const { Title, Text } = Typography;

type Props = {
  threads: Thread[];
  sortBy: "latest" | "likes" | "comments";
  gameId: number | null;
  onOpen: (id: number) => void;
  onCreate: (payload: { title: string; body: string; files: File[] }) => Promise<boolean>;
};

export default function ThreadList({ threads, sortBy, gameId, onOpen, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  // เก็บเป็น UploadFile[] (ของ antd) เพื่อให้มี uid ใช้กับ Upload ได้
  const [files, setFiles] = useState<UploadFile[]>([]);

  const disabled = !gameId || !title.trim() || !body.trim();

  const sorted = useMemo(() => {
    const arr = [...threads];
    if (sortBy === "likes") arr.sort((a, b) => b.likeCount - a.likeCount);
    else if (sortBy === "comments") arr.sort((a, b) => b.commentCount - a.commentCount);
    else arr.sort((a, b) => b.id - a.id); // latest
    return arr;
  }, [threads, sortBy]);

  const handleCreate = async () => {
    const fileObjs: File[] = files
      .map(f => f.originFileObj as File | undefined)
      .filter((f): f is File => !!f);
    const ok = await onCreate({ title: title.trim(), body: body.trim(), files: fileObjs });
    if (ok) {
      setTitle("");
      setBody("");
      setFiles([]);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* ฟอร์มสร้างเธรด */}
      <Card
        styles={{ body: { background: "#121723", padding: 18 } }}
        style={{ background: "#121723", border: "1px solid #1f2942", borderRadius: 14 }}
        title={<Title level={5} style={{ color: "#e6e6e6", margin: 0 }}>สร้างเธรดใหม่</Title>}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Input
            placeholder="หัวข้อ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ background: "#0f1420", color: "#e6e6e6", borderColor: "#2a3655" }}
          />
          <Input.TextArea
            placeholder="รายละเอียดเธรด"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
            style={{ background: "#0f1420", color: "#e6e6e6", borderColor: "#2a3655" }}
          />

          {/* แนบรูป — คุมด้วย fileList + onChange */}
          <Upload
            multiple
            accept="image/*"
            fileList={files}
            beforeUpload={() => false}           // ไม่อัปโหลดอัตโนมัติ
            onChange={({ fileList }) => setFiles(fileList)} // antd จะจัดการ uid ให้เอง
          >
            <Button icon={<UploadOutlined />}>แนบรูป</Button>
          </Upload>

          <div style={{ display: "flex", gap: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} disabled={disabled} onClick={handleCreate}>
              โพสต์เธรด
            </Button>
            {!gameId && <Text type="secondary">กรุณาเลือกเกมก่อน</Text>}
          </div>
        </Space>
      </Card>

      {/* รายการเธรด */}
      {sorted.map((t) => (
        <Card
          key={t.id}
          styles={{ body: { background: "#101524", padding: 18 } }}
          style={{ background: "#101524", border: "1px solid #1f2942", borderRadius: 14, cursor: "pointer" }}
          onClick={() => onOpen(t.id)}
        >
          <Title level={5} style={{ color: "#e6e6e6", marginTop: 0 }}>{t.title}</Title>
          <Text style={{ color: "#a8b3cf" }}>{t.author || "ไม่ระบุ"}</Text>
          <div style={{ color: "#93a0c2", fontSize: 12 }}>
            {t.createdAt ? new Date(t.createdAt).toLocaleString() : ""}
          </div>
          <div style={{ height: 6 }} />
          <div style={{ color: "#cfd7ef" }}>{t.content}</div>
        </Card>
      ))}
    </Space>
  );
}
