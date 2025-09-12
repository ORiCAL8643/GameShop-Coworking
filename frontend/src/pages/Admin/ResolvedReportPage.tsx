// src/pages/Admin/ResolvedReportsPage.tsx
import { useEffect, useState } from "react";
import { Button, Card, Tag, Typography, Modal, Empty, Space, Input } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleTwoTone,
  PaperClipOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { fetchResolvedReports, API_URL } from "../../services/Report";

const { Title, Paragraph, Text } = Typography;

type Attachment = {
  ID?: number;
  file_path?: string;
  original_name?: string;
};

type User = {
  id?: number;
  username?: string;
  name?: string;
};

type ProblemReport = {
  ID: number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | string;
  category?: string;
  created_at?: string;
  resolved_at?: string;
  user?: User | null;
  attachments?: Attachment[];
};

export default function ResolvedReportsPage() {
  const [items, setItems] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const [search, setSearch] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await fetchResolvedReports();
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handlePreview = (src: string) => {
    setPreviewSrc(src);
    setPreviewOpen(true);
  };

  // ✅ filter ตามคำค้นหา
  const filteredItems = items.filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(s) ||
      r.description?.toLowerCase().includes(s) ||
      r.category?.toLowerCase().includes(s) ||
      r.user?.username?.toLowerCase().includes(s) ||
      r.user?.name?.toLowerCase().includes(s)
    );
  });

  const pageBg = "radial-gradient(circle at top left, #1b1034, #0a0915 70%)";
  const cardStyle: React.CSSProperties = {
    background: "rgba(20, 18, 40, 0.75)",
    borderRadius: 20,
    padding: 20,
    border: "1px solid rgba(146,84,222,0.3)",
    boxShadow: "0 6px 18px rgba(146,84,222,0.25)",
    backdropFilter: "blur(12px)",
  };

  // ✅ style ปุ่มธีมม่วง–ดำ
  const purpleBtn: React.CSSProperties = {
    borderRadius: 10,
    background: "linear-gradient(135deg, #6a0dad 0%, #2e0f4d 100%)",
    border: "none",
    fontWeight: 700,
    color: "#fff",
    boxShadow: "0 0 12px rgba(146,84,222,0.6)",
    height: 44,
  };

  return (
    <div
      style={{
        background: pageBg,
        minHeight: "100vh",
        padding: "40px 40px 80px",
        color: "#f0f0f0",
        flex: 1,
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Title
          level={2}
          style={{
            flex: 1,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#52c41a",
            textShadow: "0 0 12px rgba(82,196,26,.5)",
          }}
        >
          <CheckCircleTwoTone twoToneColor="#52c41a" /> รายการที่แก้ไขแล้ว
        </Title>

        <Space>
          {/* กล่องค้นหา */}
          <Input
            placeholder="🔍 ค้นหาปัญหาที่เคยแก้..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined style={{ color: "#cfc5ff" }} />}
            style={{
              width: 260,
              borderRadius: 10,
              background: "rgba(237, 234, 234, 0.95)",
              border: "1px solid #9254de",
              color: "#500363ff",
              fontWeight: 500,
              boxShadow: "0 0 8px rgba(146,84,222,0.5)",
            }}
          />

          {/* ปุ่ม Refresh */}
          <Button
            icon={<ReloadOutlined />}
            onClick={loadReports}
            style={purpleBtn}
          >
            Refresh
          </Button>

          {/* ปุ่มกลับหน้า Admin */}
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => history.back()}
            style={{
              ...purpleBtn,
              background: "linear-gradient(135deg, #9254de 0%, #f759ab 100%)",
            }}
          >
            กลับหน้า Admin
          </Button>
        </Space>
      </div>

      {/* Grid */}
      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: 28,
        }}
      >
        {!loading && filteredItems.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              display: "flex",
              justifyContent: "center",
              paddingTop: 80,
            }}
          >
            <Empty
              description={
                <span style={{ color: "#cfc5ff" }}>ยังไม่มีรายการที่แก้ไขแล้ว</span>
              }
            />
          </div>
        )}

        {filteredItems.map((rep) => (
          <Card key={rep.ID} style={cardStyle} bordered={false} hoverable>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#cfc5ff", fontWeight: 700 }}>#{rep.ID}</Text>
              <Tag
                color="success"
                style={{
                  fontWeight: 700,
                  borderRadius: 8,
                  boxShadow: "0 0 6px rgba(82,196,26,0.4)",
                }}
              >
                Resolved
              </Tag>
            </div>

            <Paragraph style={{ marginBottom: 6 }}>
              <Text strong style={{ color: "#cfc5ff" }}>User:</Text>{" "}
              <Text style={{ color: "#fff" }}>
                {rep.user?.username || rep.user?.name || "-"}
              </Text>
            </Paragraph>

            {rep.category && (
              <Paragraph style={{ marginBottom: 6 }}>
                <Text strong style={{ color: "#cfc5ff" }}>Category:</Text>{" "}
                <Text style={{ color: "#fff" }}>{rep.category}</Text>
              </Paragraph>
            )}

            <Paragraph style={{ marginBottom: 6 }}>
              <Text strong style={{ color: "#cfc5ff" }}>Title:</Text>{" "}
              <Text style={{ color: "#fff" }}>{rep.title}</Text>
            </Paragraph>

            <Paragraph style={{ marginBottom: 12 }}>
              <Text strong style={{ color: "#cfc5ff" }}>Description:</Text>
              <br />
              <Text style={{ color: "#fff" }}>{rep.description}</Text>
            </Paragraph>

            {rep.attachments && rep.attachments.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <PaperClipOutlined />
                  <Text style={{ color: "#cfc5ff", fontWeight: 600 }}>
                    User Attachments:
                  </Text>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {rep.attachments.map((att) => {
                    const path = att.file_path || "";
                    const isImage = path
                      .toLowerCase()
                      .match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
                    const url = path.startsWith("http")
                      ? path
                      : `${API_URL}${path}`;
                    return isImage ? (
                      <img
                        key={att.ID || path}
                        src={url}
                        alt="attachment"
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 10,
                          cursor: "pointer",
                          boxShadow: "0 0 10px rgba(146,84,222,0.5)",
                        }}
                        
                      />
                    ) : (
                      <a
                        key={att.ID || path}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#40a9ff" }}
                      >
                        📄 {att.original_name || path.split("/").pop() || "file"}
                      </a>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Modal Preview */}
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        destroyOnClose
        centered
        bodyStyle={{ background: "#1b1034", padding: 0 }}
      >
        <img
          alt="preview"
          style={{ width: "100%", borderRadius: 12 }}
          src={previewSrc}
        />
      </Modal>
    </div>
  );
}
