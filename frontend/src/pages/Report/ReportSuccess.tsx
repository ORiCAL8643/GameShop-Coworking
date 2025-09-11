import React from "react";
import { Card, Button, Typography } from "antd";
import { CheckCircleTwoTone } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Title, Paragraph } = Typography;

export default function ReportSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const title = (location.state as any)?.title as string | undefined;

  return (
    <div
      style={{
        minHeight: "100vh",
        flex:1,
        background:
          "linear-gradient(135deg, #0b0a14 0%, #15122a 45%, #1b1740 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Card
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 640,
          textAlign: "center",
          background: "rgba(15,14,24,.96)",
          borderRadius: 16,
          boxShadow:
            "0 10px 34px rgba(146,84,222,.2), 0 2px 10px rgba(0,0,0,.35)",
        }}
      >
        <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 64 }} />
        <Title
          level={2}
          style={{
            marginTop: 16,
            background: "linear-gradient(90deg, #9254de, #ff5ca8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ส่งรายงานปัญหาสำเร็จ
        </Title>

        {title && (
          <Paragraph style={{ color: "#eae6ff" }}>
            หัวข้อ: <strong>{title}</strong>
          </Paragraph>
        )}

        <Paragraph style={{ color: "#cfc5ff" }}>
          เราได้รับรายงานของคุณแล้ว ทีมงานจะตรวจสอบและติดต่อกลับโดยเร็วที่สุด
        </Paragraph>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button size="large" onClick={() => navigate("/report")} style={{ borderRadius: 10 }}>
            สร้างรายงานใหม่
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate("/home")}
            style={{
              borderRadius: 10,
              background: "linear-gradient(90deg, #9254de, #ff5ca8)",
              border: "none",
            }}
          >
            กลับหน้าแรก
          </Button>
        </div>
      </Card>
    </div>
  );
}
