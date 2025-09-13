// src/components/Navbar.tsx
import {
  SearchOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
} from "@ant-design/icons";
import { useState, useMemo, type JSX } from "react";
import { AutoComplete, Input, Avatar, Space, Button, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { listGames } from "../services/game";

import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import NotificationBell from "../components/NotificationsBell";

const Navbar = () => {
  const [openAuth, setOpenAuth] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [options, setOptions] = useState<{ value: string; label: JSX.Element }[]>([]);
  const navigate = useNavigate();
  const { token, username, logout, id: userId } = useAuth();

  // ถ้าอยากใช้เป็น value ที่โชว์ตรง avatar
  const avatarText = useMemo(() => (username ? username[0]?.toUpperCase() : "U"), [username]);

  const handleSearch = async (value: string) => {
    setSearchText(value);
    const text = value.trim().toLowerCase();
    if (!text) {
      setOptions([]);
      return;
    }
    try {
      const games = await listGames();
      const filtered = games.filter((g) =>
        g.game_name?.toLowerCase().includes(text)
      );
      setOptions(
        filtered.map((g) => ({
          value: String(g.ID),
          label: <span>{g.game_name}</span>,
        }))
      );
    } catch {
      message.error("Search failed");
    }
  };

  const handleSelect = (gameId: string) => {
    navigate(`/game/${gameId}`);
    setSearchText("");
    setOptions([]);
  };

  return (
    <header
      role="banner"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: "#1f1f1f",
        borderBottom: "1px solid #2a2a2a",
      }}
    >
      {/* Search */}
      <AutoComplete
        options={options}
        onSearch={handleSearch}
        onSelect={handleSelect}
        style={{
          width: "52%",
          borderRadius: 8,
          background: "#2f2f2f",
          color: "white",
        }}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search games..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </AutoComplete>

      {/* Icons + Auth */}
      <Space size="large" align="center">
        {/* 🔔 กระดิ่ง — แสดงเฉพาะตอน login (ต้องมี userId เพื่อยิง /notifications?user_id=...) */}
        {userId ? <NotificationBell userId={userId} /> : null}

        {/* ไอคอนสถานะรีฟันด์ (ระบบเดิมของเพื่อน) */}
        <Link to="/refund-status" aria-label="Refund status">
          <DollarCircleOutlined style={{ color: "#4CAF50", fontSize: 20 }} />
        </Link>

        {/* ตะกร้า (คงสภาพเดิม ไม่ผูกลิงก์เพื่อไม่กระทบของเพื่อน) */}
        <ShoppingCartOutlined style={{ color: "white", fontSize: 18 }} />

        {/* โปรไฟล์ / ล็อกอิน */}
        {token ? (
          <>
            <span style={{ color: "white" }}>{username}</span>
            <Button onClick={logout}>Logout</Button>
            <Avatar src="https://i.pravatar.cc/300">{avatarText}</Avatar>
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
        onLoginSuccess={() => {
          // ไม่ต้องทำอะไรพิเศษ: NotificationBell จะโหลดเองเมื่อ userId มีค่า
          setOpenAuth(false);
        }}
      />
    </header>
  );
};

export default Navbar;

