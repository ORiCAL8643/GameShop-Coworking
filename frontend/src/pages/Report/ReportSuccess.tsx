import React from "react";
import { Card, Button, Typography, Tag, message } from "antd";
import { CheckCircleTwoTone, CopyOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Title, Paragraph } = Typography;

const DETAIL_ROUTE_PREFIX = "/report";

export default function ReportSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const title = (location.state as any)?.title as string | undefined;
  const stateId = (location.state as any)?.id as number | string | undefined;
  const queryId = new URLSearchParams(location.search).get("id") || undefined;
  const id = stateId ?? queryId ?? undefined;

  const copyId = async () => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(String(id));
      message.success("คัดลอกหมายเลขคำร้องแล้ว");
    } catch {
      message.error("คัดลอกไม่สำเร็จ");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        flex: 1,
        background:
          "radial-gradient(circle at top left, #1b1034 0%, #0a0915 80%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      <Card
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 640,
          textAlign: "center",
          background: "rgba(20,18,40,0.85)",
          borderRadius: 20,
          padding: "40px 32px",
          boxShadow:
            "0 8px 28px rgba(146,84,222,0.35), 0 0 16px rgba(146,84,222,0.4) inset",
          backdropFilter: "blur(10px)",
        }}
      >
        <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 72 }} />
        <Title
          level={2}
          style={{
            marginTop: 20,
            marginBottom: 10,
            background: "linear-gradient(90deg, #9254de, #ff5ca8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 18px rgba(157, 78, 221, 0.6)",
            fontWeight: 900,
          }}
        >
          ✅ ส่งรายงานปัญหาสำเร็จ
        </Title>

        {id && (
          <Paragraph style={{ color: "#eae6ff", marginBottom: 8, fontSize: 16 }}>
            หมายเลขคำร้องของคุณคือ{" "}
            <Tag
              color="purple"
              style={{
                fontSize: 15,
                padding: "4px 10px",
                borderRadius: 8,
              }}
            >
              #{id}
            </Tag>
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={copyId}
              style={{ paddingInline: 6, color: "#9254de", fontWeight: 600 }}
            >
              คัดลอก
            </Button>
          </Paragraph>
        )}

        {title && (
          <Paragraph style={{ color: "#cfc5ff", marginTop: 0, fontSize: 15 }}>
            หัวข้อ: <strong style={{ color: "#fff" }}>{title}</strong>
          </Paragraph>
        )}

        <Paragraph style={{ color: "#bfbfbf", margin: "16px 0 28px" }}>
          เราได้รับรายงานของคุณแล้ว ทีมงานจะตรวจสอบและติดต่อกลับโดยเร็วที่สุด  
          เมื่อมีการตอบกลับ คุณจะได้รับการแจ้งเตือนที่ 🔔 มุมขวาบน
        </Paragraph>

        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <Button
            size="large"
            onClick={() => navigate("/report")}
            style={{
              borderRadius: 12,
              fontWeight: 600,
              background: "#262626",
              color: "#fff",
              border: "1px solid #434343",
            }}
          >
            ➕ สร้างรายงานใหม่
          </Button>

          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/home")}
            style={{
              borderRadius: 12,
              fontWeight: 700,
              background: "linear-gradient(90deg, #9254de, #ff5ca8)",
              border: "none",
              boxShadow: "0 0 14px rgba(146,84,222,0.7)",
            }}
          >
            ⬅ กลับหน้าแรก
          </Button>
        </div>
      </Card>
    </div>
  );
}
