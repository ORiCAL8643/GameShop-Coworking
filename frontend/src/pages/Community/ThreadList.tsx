// src/pages/Community/ThreadList.tsx
import { useMemo, useState } from "react";
import {
  Avatar, Badge, Button, Card, Input, Space, Typography, Upload
} from "antd";
import {
  LikeOutlined, MessageOutlined, PictureOutlined, SendOutlined, UserOutlined
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface"; // ✅
import type { Thread, CreateThreadPayload } from "./types";

const { Title, Text } = Typography;

type Props = {
  threads: Thread[];
  sortBy: "latest" | "likes" | "comments";
  onOpen: (threadId: number) => void;
  onCreate: (payload: CreateThreadPayload & { images?: string[] }) => void; // ✅
};

export default function ThreadList({ threads, sortBy, onOpen, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]); // ✅ เก็บไฟล์ภาพที่เลือก

  const canSubmit = title.trim() && body.trim();

  // แปลงไฟล์เป็น preview URL
  const toUrls = (list: UploadFile[]) =>
    list
      .map((f) => (f.originFileObj ? URL.createObjectURL(f.originFileObj) : (f.url as string)))
      .filter(Boolean) as string[];

  const resetForm = () => {
    // cleanup object URLs
    files.forEach((f) => {
      if (f.originFileObj) URL.revokeObjectURL(URL.createObjectURL(f.originFileObj));
    });
    setTitle("");
    setBody("");
    setFiles([]);
  };

  const sortedThreads = useMemo(() => {
    const arr = [...threads];
    return arr.sort((a, b) => {
      if (sortBy === "likes") return b.likes - a.likes;
      if (sortBy === "comments")
        return b.commentCount - a.commentCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [threads, sortBy]);

  const sortLabel =
    sortBy === "likes" ? "Likes" : sortBy === "comments" ? "Comments" : "Latest";

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* กล่องสร้างเธรดใหม่ */}
      <Card className="community-card">
        <Title level={4} style={{ color: "#fff", marginTop: 0 }}>
          เริ่มกระดานสนทนาใหม่
        </Title>

        <div className="dark-input">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="กรอกหัวข้อ"
            style={{ marginBottom: 8 }}
          />
          <Input.TextArea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
            placeholder="พูดอะไรสักอย่างสิ"
            style={{ marginBottom: 8 }}
          />
        </div>

        {/* ✅ ปุ่ม/รายการรูปภาพ (เฉพาะสร้างเธรด) */}
        <Upload
          multiple
          accept="image/*"
          listType="picture-card"
          fileList={files}
          beforeUpload={() => false}               // ไม่อัปโหลดขึ้นเซิร์ฟเวอร์ทันที
          onChange={({ fileList }) => setFiles(fileList)}
          onRemove={(file) => {
            setFiles((prev) => prev.filter((f) => f.uid !== file.uid));
          }}
        >
          {/* ปุ่มเพิ่มภาพ */}
          <div style={{ color: "#fff" }}>
            <PictureOutlined /> <div style={{ marginTop: 4 }}>แนบรูป</div>
          </div>
        </Upload>

        <Space style={{ marginTop: 8 }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            disabled={!canSubmit}
            onClick={() => {
              onCreate({
                title: title.trim(),
                body: body.trim(),
                images: toUrls(files),          // ✅ ส่ง URL ของรูปไปเก็บกับเธรด
              });
              resetForm();
            }}
          >
            โพสต์กระดานสนทนา
          </Button>
        </Space>
      </Card>

      <Text style={{ color: "#ccc" }}>Sorted by: {sortLabel}</Text>

      {/* รายการเธรดทั้งหมด */}
      {sortedThreads.map((t) => (
        <Card
          key={t.id}
          className="community-card"
          bodyStyle={{ padding: 20 }}
          hoverable
          onClick={() => onOpen(t.id)}
        >
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Title level={4} style={{ color: "#fff", margin: 0 }}>
              {t.title}
            </Title>
            <Text style={{ color: "#ccc" }}>{t.body}</Text>

            {/* แสดงรูปแนบ (ถ้ามี) */}
            {!!t.images?.length && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {t.images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`thread-img-${i}`}
                    style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #303030" }}
                  />
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar icon={<UserOutlined />} />
                <Text style={{ color: "#aaa" }}>by {t.author} · {t.createdAt}</Text>
              </div>
              <Space>
                <Button icon={<LikeOutlined />} shape="circle" />
                <Badge count={t.commentCount} size="small">
                  <Button icon={<MessageOutlined />} shape="circle" />
                </Badge>
              </Space>
            </div>
          </Space>
        </Card>
      ))}
    </Space>
  );
}
