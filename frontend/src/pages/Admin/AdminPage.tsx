// src/pages/AdminPage.tsx
import { useState, useEffect } from "react";
import { Card, Button, Typography, Tag, Input, Upload, message, Modal } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { fetchReports, resolveReport } from "../../services/Report";
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
  const [replies, setReplies] = useState<Record<number, { text: string; fileList: UploadFile[] }>>({});
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchReports();
        setProblems(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRefundAction = (id: number, action: "Approved" | "Rejected") => {
    const updated = refunds.map((r) =>
      r.id === id ? { ...r, status: action } : r
    );
    setRefunds(updated);
    message.success(`Refund #${id} ${action} successfully!`);
    addRefundUpdate(`Refund #${id} ${action.toLowerCase()}`);
  };

  const handleSendReply = async (rep: ProblemReport) => {
    const reply = replies[rep.ID];
    if (!reply || (!reply.text && reply.fileList.length === 0)) {
      message.warning("กรุณาพิมพ์ข้อความหรือติดไฟล์อย่างน้อย 1 อย่าง");
      return;
    }
    try {
      await createNotification({
        title: `ตอบกลับคำร้อง #${rep.ID}`,
        message: reply.text,
        type: "report",
        user_id: rep.user_id,
      });
      message.success("ส่งคำตอบกลับไปยังลูกค้าเรียบร้อย!");
      await resolveReport(rep.ID);
      setProblems((prev) =>
        prev.map((p) => (p.ID === rep.ID ? { ...p, status: "resolved" } : p))
      );
      addNotification(`Problem report #${rep.ID} has a reply`);
    } catch (e) {
      console.error(e);
      message.error("ส่งคำตอบไม่สำเร็จ");
    }
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

  const handlePreview = (file: UploadFile) => {
      setPreviewImage(file.thumbUrl || file.url || "");
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

  return (
    <div
      style={{
        background: "#0f0c29",
        minHeight: "100vh",
        padding: "50px",
        color: "#fff",
        fontFamily: "'Poppins', sans-serif",
        flex:1
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
              {tab === "refunds"
                ? "💸 Refund Requests"
                : "⚡ Problem Reports"}
            </Button>
          );
        })}
      </div>

      {/* Refund Requests */}
      {activeTab === "refunds" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "25px",
          }}
        >
          {refunds.map((req) => (
            <Card key={req.id} style={cardStyle}>
              <p style={textStyle}>User: {req.user}</p>
              <p style={textStyle}>Game: {req.game}</p>
              <p style={textStyle}>Reason: {req.reason}</p>
              <p style={textStyle}>Order ID: {req.orderId}</p>
              <p style={textStyle}>
                Status:{" "}
                <Tag
                  color={
                    req.status === "Pending"
                      ? "#d9d9d9"
                      : req.status === "Approved"
                      ? "#05ef66"
                      : "#ff6b81"
                  }
                  style={{
                    fontWeight: 700,
                    color: "#000",
                    textShadow: "0 0 8px rgba(255,255,255,0.7)",
                    borderRadius: 8,
                  }}
                >
                  {req.status}
                </Tag>
              </p>
              {req.status === "Pending" && (
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "flex-start",
                    gap: "15px",
                  }}
                >
                  <Button
                    onClick={() => handleRefundAction(req.id, "Approved")}
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
                    ✅ Approve
                  </Button>
                  <Button
                    onClick={() => handleRefundAction(req.id, "Rejected")}
                    style={{
                      flex: 1,
                      background:
                        "linear-gradient(90deg, #f5222d, #cf1322)",
                      color: "white",
                      fontWeight: "bold",
                      borderRadius: 12,
                      boxShadow: "0 0 10px #f5222d",
                    }}
                  >
                    ❌ Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

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
              <p style={textStyle}>User: {rep.user?.username ?? rep.user_id}</p>
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
                  <div
                    style={{ display: "flex", gap: "15px", marginTop: 12 }}
                  >
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
