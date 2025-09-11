// src/pages/Admin/AdminPage.tsx
import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Tag,
  Input,
  Upload,
  message,
  Modal,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import {
  fetchReports,
  resolveReport,
  replyReport,
} from "../../services/Report";
import type { ProblemReport } from "../../interfaces/problem_report";
import type { UploadFile } from "antd/es/upload/interface";
import { useNavigate } from "react-router-dom";
import { markReportsSeen } from "../../hooks/useReportNewCount";
import { useAuth } from "../../context/AuthContext";

const { Title } = Typography;
const { TextArea } = Input;

interface RefundRequest {
  id: number;
  orderId: string;
  user: string;
  game: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}
interface AdminPageProps {
  refunds: RefundRequest[];
  setRefunds: (refunds: RefundRequest[]) => void;
  addNotification: (msg: string) => void;
  addRefundUpdate: (msg: string) => void;
}

export default function AdminPage({
  refunds,
  setRefunds,
}: AdminPageProps) {
  const navigate = useNavigate();
  const auth = useAuth();

  const ENV_FORCE_ADMIN_ID = Number(import.meta.env.VITE_FORCE_ADMIN_ID || "");
  const adminId =
    (auth as any)?.id ??
    (Number.isFinite(ENV_FORCE_ADMIN_ID) && ENV_FORCE_ADMIN_ID > 0
      ? ENV_FORCE_ADMIN_ID
      : 1);

  const [problems, setProblems] = useState<ProblemReport[]>([]);
  const [activeTab, setActiveTab] = useState<"refunds" | "problems">("problems");
  const [replies, setReplies] = useState<
    Record<number, { text: string; fileList: UploadFile[] }>
  >({});
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchReports();
        setProblems(items || []);

        // ✅ ตั้ง "เวลาที่เห็นล่าสุด" = created_at ที่ใหม่ที่สุดในชุดข้อมูล (หรือเวลาปัจจุบันถ้าไม่มี)
        const latestTs = (items || []).reduce((max, r) => {
          const t = r.created_at ? Date.parse(r.created_at) : 0;
          return t > max ? t : max;
        }, 0);
        markReportsSeen(latestTs ? new Date(latestTs).toISOString() : undefined);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleRefundAction = (id: number, action: "Approved" | "Rejected") => {
    const updated = refunds.map((r) =>
      r.id === id ? { ...r, status: action } : r
    );
    setRefunds(updated);
    message.success(`Refund #${id} ${action} successfully!`);
  };

  const handleSendReply = async (rep: ProblemReport) => {
    const reply = replies[rep.ID];
    if (!reply || (!reply.text && (reply.fileList?.length ?? 0) === 0)) {
      message.warning("กรุณาพิมพ์ข้อความหรือติดไฟล์อย่างน้อย 1 อย่าง");
      return;
    }

    try {
      const files: File[] = (reply.fileList || [])
        .map((f: UploadFile) =>
          f.originFileObj && f.originFileObj instanceof File
            ? (f.originFileObj as File)
            : null
        )
        .filter((f: File | null): f is File => f !== null);

      await replyReport(rep.ID, adminId, reply.text, files);
      message.success("ตอบกลับลูกค้าสำเร็จ");
    } catch (e: any) {
      console.error("❌ Error while sending reply:", e);
      const detail = e?.response?.data?.error || e?.message || String(e);
      message.error(`ไม่สามารถส่งคำตอบได้: ${detail}`);
    }

    setReplies((prev) => ({ ...prev, [rep.ID]: { text: "", fileList: [] } }));
  };

  // ✅ ปิดงานเป็น resolved แล้วลบออกจากลิสต์
  const handleResolveProblem = async (id: number) => {
    try {
      await resolveReport(id);
      setProblems((prev) => prev.filter((p) => p.ID !== id));
      message.success(`Problem report #${id} marked as resolved`);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePreview = (file: UploadFile | string) => {
    if (typeof file === "string") {
      setPreviewImage(file);
    } else {
      setPreviewImage(file.thumbUrl || file.url || "");
    }
    setPreviewOpen(true);
  };

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

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

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
            background: "linear-gradient(90deg, #9254de, #f759ab, #9d4edd)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 20px rgba(157, 78, 221, 0.6)",
            marginBottom: 30,
            fontWeight: 900,
          }}
        >
          🎮 Admin Dashboard
        </Title>

        <Button
          type="primary"
          onClick={() => navigate("/Admin/Resolved")}
          style={{
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(90deg, #52c41a, #2bbb72)",
            border: "none",
            fontWeight: 700,
          }}
        >
          ดูรายการที่แก้ไขแล้ว
        </Button>
      </div>

      {/* Tabs */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        {["refunds", "problems"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Button
              key={tab}
              type="primary"
              onClick={() => setActiveTab(tab as "refunds" | "problems")}
              style={{
                marginRight: 15,
                padding: "10px 25px",
                background: isActive
                  ? tab === "refunds"
                    ? "linear-gradient(90deg, #9254de, #f759ab)"
                    : "linear-gradient(90deg, #f759ab, #9254de)"
                  : "#1f1f1f",
                border: "none",
                color: "#fff",
                fontWeight: "bold",
                fontSize: 15,
                borderRadius: 12,
                boxShadow: isActive
                  ? "0 0 15px rgba(255,255,255,0.3), 0 0 25px rgba(147, 84, 222, 0.6)"
                  : "none",
                transition: "0.3s",
              }}
            >
              {tab === "refunds" ? "💸 Refund Requests" : "⚡ Problem Reports"}
            </Button>
          );
        })}
      </div>

      {/* Problem Reports: เฉพาะที่ยังไม่ resolved */}
      {activeTab === "problems" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "25px",
          }}
        >
          {problems.map((rep) => (
            <Card key={rep.ID} style={cardStyle}>
              <p style={textStyle}>
                User: {rep.user?.username ?? (rep as any).user_id}
              </p>
              <p style={textStyle}>Title: {rep.title}</p>
              <p style={textStyle}>Description: {rep.description}</p>
              <p style={textStyle}>
                Status: <Tag color="#f0a6ff">⏳ Pending</Tag>
              </p>

              {rep.attachments && rep.attachments.length > 0 && (
                <div style={{ margin: "15px 0" }}>
                  <p style={{ ...textStyle, marginBottom: 8 }}>
                    📎 User Attachments:
                  </p>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
                  >
                    {rep.attachments.map((att) => {
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

              {/* Reply form */}
              <div style={{ marginTop: "20px" }}>
                <TextArea
                  rows={3}
                  placeholder="พิมพ์ข้อความตอบกลับลูกค้า..."
                  value={replies[rep.ID]?.text || ""}
                  onChange={(e) =>
                    setReplies((prev) => ({
                      ...prev,
                      [rep.ID]: {
                        text: e.target.value,
                        fileList: prev[rep.ID]?.fileList || [],
                      },
                    }))
                  }
                  style={{
                    marginBottom: 12,
                    background: "#141414",
                    color: "#fff",
                    borderRadius: 12,
                    border: "1px solid #434343",
                    boxShadow: "0 0 8px #9d4edd inset",
                    padding: 10,
                  }}
                />
                <Upload
                  fileList={replies[rep.ID]?.fileList || []}
                  beforeUpload={() => false}
                  onChange={({ fileList }: { fileList: UploadFile[] }) =>
                    setReplies((prev) => ({
                      ...prev,
                      [rep.ID]: {
                        text: prev[rep.ID]?.text || "",
                        fileList,
                      },
                    }))
                  }
                  onPreview={handlePreview}
                  listType="picture-card"
                  multiple
                >
                  {(!replies[rep.ID] ||
                    replies[rep.ID].fileList.length < 5) && (
                    <div style={{ color: "#aaa" }}>
                      <UploadOutlined /> อัปโหลด
                    </div>
                  )}
                </Upload>
                <div style={{ display: "flex", gap: "15px", marginTop: 12 }}>
                  <Button
                    onClick={() => handleSendReply(rep)}
                    style={{
                      flex: 1,
                      background: "linear-gradient(90deg, #52c41a, #389e0d)",
                      color: "white",
                      fontWeight: "bold",
                      borderRadius: 12,
                      boxShadow: "0 0 10px #52c41a",
                    }}
                  >
                    📩 Send Reply
                  </Button>
                  <Button
                    onClick={() => handleResolveProblem(rep.ID)}
                    style={{
                      flex: 1,
                      background: "linear-gradient(90deg, #f759ab, #9254de)",
                      color: "white",
                      fontWeight: "bold",
                      borderRadius: 12,
                      boxShadow: "0 0 10px #f759ab",
                    }}
                  >
                    ✔ Mark as Resolved
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
