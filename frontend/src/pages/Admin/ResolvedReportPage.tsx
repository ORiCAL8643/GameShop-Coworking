// src/pages/Admin/ResolvedReportsPage.tsx
import { useEffect, useState } from "react";
import { Card, Button, Typography, Tag, Modal } from "antd";
import { fetchResolvedReports } from "../../services/Report";
import type { ProblemReport } from "../../interfaces/problem_report";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

export default function ResolvedReportsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ProblemReport[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

  useEffect(() => {
    const load = async () => {
      try {
        const all = await fetchResolvedReports();
        setItems(all || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const cardStyle = {
    background: "rgba(27,16,52,0.8)",
    borderRadius: 20,
    padding: 25,
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow:
      "0 8px 25px rgba(147, 84, 222, 0.3),0 0 15px rgba(255,255,255,0.05) inset",
    backdropFilter: "blur(6px)",
  };

  const textStyle = {
    fontSize: 16,
    fontWeight: 600 as const,
    color: "#ffffff",
  };

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewOpen(true);
  };

  return (
    <div
      style={{
        background: "#0f0c29",
        minHeight: "100vh",
        padding: "50px",
        color: "#fff",
        fontFamily: "'Poppins', sans-serif",
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Title
          level={2}
          style={{
            flex: 1,
            background: "linear-gradient(90deg, #52c41a, #2bbb72)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 20px rgba(82, 196, 26, .6)",
            marginBottom: 30,
            fontWeight: 900,
          }}
        >
          ✅ Resolved Problem Reports
        </Title>

        <Button
          onClick={() => navigate("/Admin/Page")}
          style={{
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(90deg, #9254de, #f759ab)",
            color: "#fff",
            border: "none",
            fontWeight: 700,
          }}
        >
          กลับไปหน้า Admin
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: "25px",
        }}
      >
        {items.map((rep) => {
          const reply = rep.replies?.[0];
          return (
            <Card key={rep.ID} style={cardStyle}>
              <p style={textStyle}>
                User: {rep.user?.username ?? (rep as any).user_id}
              </p>
              <p style={textStyle}>Title: {rep.title}</p>
              <p style={textStyle}>Description: {rep.description}</p>
              <p style={textStyle}>
                Status: <Tag color="#52c41a">✅ Resolved</Tag>
              </p>

              {reply && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ ...textStyle, marginBottom: 8 }}>
                    📨 Admin Reply:
                  </p>
                  <div
                    style={{
                      background: "#141322",
                      padding: "10px 12px",
                      borderRadius: 8,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {reply.message}
                  </div>

                  {reply.attachments && reply.attachments.length > 0 && (
                    <div style={{ marginTop: 15 }}>
                      <p style={{ ...textStyle, marginBottom: 8 }}>
                        📎 Reply Attachments:
                      </p>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
                      >
                        {reply.attachments.map((att) => {
                          const path = (att as any).file_path || "";
                          const isImage = path
                            .toLowerCase()
                            .match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
                          const url = `${API_URL}/${path}`;
                          return isImage ? (
                            <img
                              key={(att as any).ID}
                              src={url}
                              alt="attachment"
                              style={{
                                width: 100,
                                height: 100,
                                objectFit: "cover",
                                borderRadius: 8,
                                cursor: "pointer",
                                boxShadow: "0 0 6px rgba(0,0,0,0.4)",
                              }}
                              onClick={() => handlePreview(url)}
                            />
                          ) : (
                            <a
                              key={(att as any).ID}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#40a9ff" }}
                            >
                              📄 {path.split("/").pop()}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        destroyOnClose
      >
        <img
          alt="preview"
          style={{ width: "100%", borderRadius: 12 }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
}
