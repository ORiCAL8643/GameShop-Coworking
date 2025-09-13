import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Input,
  Upload,
  Button,
  Space,
  message,
  List,
  Segmented,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd/es/upload";
import dayjs from "dayjs";
import type { Thread } from "./CommunityPage";

const { Title, Text } = Typography;
const { TextArea } = Input;

type Props = {
  threads: Thread[];
  gameId: number | null;
  onOpen: (id: number) => void;
  onCreate: (args: { title: string; body: string; files: File[] }) => Promise<boolean> | void;
  /** ค่าเริ่มต้นของการเรียง (optional) */
  sortBy?: "latest" | "oldest" | "most_liked" | "most_commented";
};

// เก็บไฟล์ + พรีวิวในหน่วยความจำ
type LocalFile = { uid: string; file: File; url: string };

export default function ThreadList({
  threads,
  gameId,
  onOpen,
  onCreate,
  sortBy: initialSort = "latest",
}: Props) {
  // ฟอร์มสร้างเธรด
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // sort
  type SortKey = "latest" | "oldest" | "most_liked" | "most_commented";
  const [sortBy, setSortBy] = useState<SortKey>(initialSort);

  // สร้าง UploadFile จาก LocalFile
  const uploadFileList: UploadFile[] = useMemo(
    () =>
      files.map((f) => ({
        uid: f.uid,
        name: f.file.name,
        status: "done",
        url: f.url,
      })),
    [files]
  );

  const uploadProps: UploadProps = {
    multiple: true,
    accept: "image/*",
    listType: "picture-card",
    beforeUpload: (file) => {
      const uid = `${file.lastModified}-${file.size}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const url = URL.createObjectURL(file);
      setFiles((prev) => [...prev, { uid, file, url }]);
      return false; // ไม่อัปโหลดทันที
    },
    onRemove: (file) => {
      const uid = file.uid!;
      setFiles((prev) => {
        const target = prev.find((x) => x.uid === uid);
        if (target) URL.revokeObjectURL(target.url);
        return prev.filter((x) => x.uid !== uid);
      });
    },
    fileList: uploadFileList,
    // ไม่ต้องอัปโหลดจริง (ปล่อยให้ form submit)
    customRequest: ({ onSuccess }) => onSuccess && onSuccess({}, new XMLHttpRequest()),
  };

  useEffect(() => {
    // cleanup object URLs on unmount
    return () => files.forEach((f) => URL.revokeObjectURL(f.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postDisabled = useMemo(
    () => !gameId || !title.trim() || !body.trim(),
    [gameId, title, body]
  );

  async function handleCreate() {
    if (postDisabled) {
      message.warning("กรอกหัวข้อ/รายละเอียด และเลือกเกมก่อน");
      return;
    }
    try {
      setSubmitting(true);
      const ok = await onCreate({
        title: title.trim(),
        body: body.trim(),
        files: files.map((f) => f.file),
      });
      if (ok !== false) {
        setTitle("");
        setBody("");
        files.forEach((f) => URL.revokeObjectURL(f.url));
        setFiles([]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = useMemo(() => {
    const arr = [...threads];
    switch (sortBy) {
      case "latest":
        arr.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        arr.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "most_liked":
        arr.sort((a, b) => b.likeCount - a.likeCount);
        break;
      case "most_commented":
        arr.sort((a, b) => b.commentCount - a.commentCount);
        break;
    }
    return arr;
  }, [threads, sortBy]);

  return (
    <div style={{ width: "100%", display: "grid", gap: 16 }}>
      {/* สร้างเธรด */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Text style={{ color: "#e6e6e6" }}>สร้างเธรดใหม่</Text>
            <div style={{ flex: 1 }} />
            <Text style={{ color: "#a8b3cf" }}>เรียงโดย:</Text>
            <Segmented<SortKey>
              value={sortBy}
              onChange={(v) => setSortBy(v as SortKey)}
              options={[
                { label: "ล่าสุด", value: "latest" },
                { label: "เก่าสุด", value: "oldest" },
                { label: "ถูกใจเยอะสุด", value: "most_liked" },
                { label: "คอมเมนต์เยอะสุด", value: "most_commented" },
              ]}
            />
          </div>
        }
        styles={{ body: { background: "#0e1320" } }}
        style={{
          background: "#0e1320",
          border: "1px solid #1f2942",
          borderRadius: 14,
          width: "100%",
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Input
            placeholder="หัวข้อ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextArea
            placeholder="รายละเอียดเธรด"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
          />

          {/* Upload + Preview + Remove */}
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>แนบรูป</Button>
          </Upload>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Button
              type="primary"
              onClick={handleCreate}
              loading={submitting}
              disabled={postDisabled}
            >
              โพสต์เธรด
            </Button>
          </div>
        </Space>
      </Card>

      {/* รายการเธรด */}
      <List
        dataSource={sorted}
        renderItem={(t) => (
          <List.Item style={{ padding: 0, border: "none", marginBottom: 12 }}>
            <Card
              hoverable
              onClick={() => onOpen(t.id)}
              styles={{ body: { background: "#0e1320" } }}
              style={{
                cursor: "pointer",
                background: "#0e1320",
                border: "1px solid #1f2942",
                borderRadius: 14,
                width: "100%",
              }}
            >
              <Title level={4} style={{ color: "#e6e6e6", marginBottom: 8 }}>
                {t.title}
              </Title>
              <Text style={{ color: "#a8b3cf" }}>{t.content}</Text>

              {/* แกลเลอรีภาพ (ถ้ามี) */}
              {!!t.images?.length && (
                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gap: 8,
                    gridTemplateColumns:
                      t.images.length >= 4 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
                  }}
                >
                  {t.images.slice(0, 8).map((img) => (
                    <div
                      key={img.id}
                      style={{
                        position: "relative",
                        paddingTop: "66%",
                        overflow: "hidden",
                        borderRadius: 10,
                        border: "1px solid #22304e",
                        background: "#0b0f1a",
                      }}
                    >
                      <img
                        src={img.url}
                        alt=""
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ))}
                  {t.images.length > 8 && (
                    <div
                      style={{
                        position: "relative",
                        paddingTop: "66%",
                        borderRadius: 10,
                        border: "1px solid #22304e",
                        background: "#0b0f1a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#cbd5e1",
                        fontWeight: 600,
                      }}
                    >
                      +{t.images.length - 8}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 10, color: "#8892b0" }}>
                by <b style={{ color: "#cbd5e1" }}>{t.author || "ไม่ระบุ"}</b>{" "}
                · {dayjs(t.createdAt).format("D/M/YYYY HH:mm")} · ถูกใจ{" "}
                {t.likeCount} · คอมเมนต์ {t.commentCount}
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
