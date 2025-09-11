// src/components/Navbar.tsx
import { SearchOutlined, ShoppingCartOutlined, DollarCircleOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { Input, Avatar, Space, Button } from "antd";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

// ✅ ใช้ชื่อ/พาธให้ตรงกับไฟล์ของคุณ (ถ้าไฟล์ชื่อ NotificationsBell.tsx ให้ import ตามนี้)
import NotificationBell from "../components/NotificationsBell";

const Navbar = () => {
  const [openAuth, setOpenAuth] = useState(false);
  const { token, username, logout, id: userId } = useAuth();
  console.log("Navbar userId=", userId);

  // ให้แน่ใจว่า userId เปลี่ยนแล้วคอมโพเนนต์จะรีเรนเดอร์ (สำหรับบาง context)
  useEffect(() => {}, [userId]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: "#1f1f1f",
      }}
    >
      {/* Search */}
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search"
        style={{
          width: "52%",
          borderRadius: 8,
          background: "#2f2f2f",
          color: "white",
        }}
      />

      {/* Icons + Auth */}
      <Space size="large" align="center">
        {/* 🔔 กระดิ่ง — แสดงเฉพาะตอน login (ต้องมี userId เพื่อยิง /notifications?user_id=...) */}
        {userId ? <NotificationBell userId={userId} /> : null}

        {/* ไอคอนสถานะรีฟันด์ (ระบบเดิมของเพื่อน) */}
        <Link to="/refund-status" aria-label="Refund status">
          <DollarCircleOutlined style={{ color: "#4CAF50", fontSize: 20 }} />
        </Link>

        {/* ตะกร้า */}
        <ShoppingCartOutlined style={{ color: "white", fontSize: 18 }} />

        {/* โปรไฟล์ / ล็อกอิน */}
        {token ? (
          <>
            <span style={{ color: "white" }}>{username}</span>
            <Button onClick={logout}>Logout</Button>
            
          </>
        ) : (
          <Button type="primary" onClick={() => setOpenAuth(true)}>
            Login
          </Button>
        )}
      </Space>

      {/* Modal เข้าสู่ระบบ */}
      <AuthModal
        open={openAuth}
        onClose={() => setOpenAuth(false)}
        // ถ้าอยากให้รีโหลดกระดิ่งทันทีหลังล็อกอิน:
        onLoginSuccess={() => {
          // แค่อุดช่องให้ไม่ error; NotificationBell จะเริ่มโหลดเองเมื่อ userId มีค่า
        }}
      />
    </div>
  );
};

export default Navbar;
