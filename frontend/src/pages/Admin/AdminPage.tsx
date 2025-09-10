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
import { fetchReports, resolveReport, replyReport } from "../../services/Report";
import { createNotification } from "../../services/Notification";
import type { ProblemReport } from "../../interfaces/problem_report";
import type { UploadFile } from "antd/es/upload/interface";

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
  addNotification,
  addRefundUpdate,
}: AdminPageProps) {
  const [problems, setProblems] = useState<ProblemReport[]>([]);
  const [activeTab, setActiveTab] = useState<"refunds" | "problems">("refunds");
  const [replies, setReplies] = useState<
    Record<number, { text: string; fileList: UploadFile[] }>
  >({});
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchReports();
        setProblems(items);
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
    addRefundUpdate(`Refund #${id} ${action.toLowerCase()}`);
  };

  // ✅ ตอบกลับลูกค้าด้วยข้อความ + ไฟล์ + สร้างแจ้งเตือน
  const handleSendReply = async (rep: ProblemReport) => {
    const reply = replies[rep.ID];
    if (!reply || (!reply.text && reply.fileList.length === 0)) {
      message.warning("กรุณาพิมพ์ข้อความหรือติดไฟล์อย่างน้อย 1 อย่าง");
      return;
    }

    try {
      // รวมไฟล์แนบ
      const files: File[] = (reply.fileList || [])
        .map((f: UploadFile) => {
          if (f.originFileObj && f.originFileObj instanceof File) {
            return f.originFileObj as File;
          }
          return null;
        })
        .filter((f: File | null): f is File => f !== null);

      // ส่งคำตอบไป backend
      const updated = await replyReport(rep.ID, reply.text, files);
      setProblems((prev: any[]) =>
        prev.map((p) => (p.ID === rep.ID ? updated : p))
      );

      // ✅ หาค่า user_id ของเจ้าของคำร้อง
      const targetUserId =
        rep.user_id || rep.user?.ID || rep.user?.ID || 0;

      if (!targetUserId) {
        message.error("ไม่สามารถระบุผู้รับแจ้งเตือนได้ (user_id หาย)");
        return;
      }

      // ✅ ยิงแจ้งเตือนให้ลูกค้าเจ้าของคำร้อง
      const payload = {
        title: `ตอบกลับคำร้อง #${rep.ID}`,
        message: reply.text || "มีการตอบกลับคำร้องของคุณ",
        type: "report",
        user_id: Number(targetUserId),
      };
      console.log("🔔 createNotification payload =>", payload);
      await createNotification(payload);

      addNotification(`Problem report #${rep.ID} has a reply`);
      message.success("ตอบกลับลูกค้าสำเร็จ และส่งการแจ้งเตือนแล้ว");
    } catch (e: any) {
      console.error("❌ Error while sending reply:", e);
      const detail = e?.response?.data?.error || e?.message || String(e);
      message.error(`ไม่สามารถส่งคำตอบ/แจ้งเตือนได้: ${detail}`);
    }

    // ล้างช่อง reply
    setReplies((prev) => ({ ...prev, [rep.ID]: { text: "", fileList: [] } }));
  };

  const handleResolveProblem = async (id: number) => {
    try {
      const updated = await resolveReport(id);
      setProblems((prev) => prev.map((p) => (p.ID === id ? updated : p)));
      message.success(`Problem report #${id} marked as resolved`);
    } catch (e) {
      console.error(e);
      message.error("ไม่สามารถอัปเดตสถานะได้");
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
      <Title
        level={2}
        style={{
          textAlign: "center",
          background: "linear-gradient(90deg, #9254de, #f759ab, #9d4edd)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          textShadow: "0 0 20px rgba(157, 78, 221, 0.6)",
          marginBottom: "50px",
          fontWeight: 900,
        }}
      >
        🎮 Admin Dashboard
      </Title>

      {/* Tabs */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
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

      {/* Problem Reports */}
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
                Status:{" "}
                {rep.status === "resolved" ? (
                  <Tag color="#52c41a">✅ Resolved</Tag>
                ) : (
                  <Tag color="#f0a6ff">⏳ Pending</Tag>
                )}
              </p>

              {/* Attachments */}
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
                        .match(/\.(jpg|jpeg|png|gif)$/i);
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
              {rep.status !== "resolved" && (
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
                        background:
                          "linear-gradient(90deg, #52c41a, #389e0d)",
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
                        background:
                          "linear-gradient(90deg, #f759ab, #9254de)",
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
              )}
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
