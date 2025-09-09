import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Pagination,
  Input,
  Layout,
  List,
} from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listGames, listUserGames } from "../../services/workshop";
import type { Game } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Content, Sider } = Layout;
const { Text } = Typography;
const { Search } = Input;

const WorkshopMain: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState("all");
  const [games, setGames] = useState<Game[]>([]);
  const [yourGames, setYourGames] = useState<number[]>([]);
  const navigate = useNavigate();
  const { id: userId } = useAuth();

  useEffect(() => {
    listGames().then(setGames).catch(console.error);
    if (userId) {
      listUserGames(userId)
        .then((rows) => setYourGames(rows.map((r) => r.game_id)))
        .catch(console.error);
    }
  }, [userId]);

  const filtered = games.filter((g) => {
    const matchesSearch = g.game_name
      .toLowerCase()
      .includes(search.toLowerCase());
    if (activeMenu === "your-games") {
      return yourGames.includes(g.ID) && matchesSearch;
    }
    return matchesSearch;
  });

  return (
    <Layout style={{ background: "#0f1419", minHeight: "100vh" }}>
      <Content style={{ padding: "20px" }}>
        <h2 style={{ color: "white" }}>
          {activeMenu === "your-games" ? "Your Games" : "Browse All Workshops"}
        </h2>

        <div style={{ marginBottom: 20 }}>
          <Search
            placeholder="ค้นหา Workshop..."
            allowClear
            enterButton
            onSearch={(value) => setSearch(value)}
            style={{ maxWidth: 400 }}
          />
        </div>

        <Row gutter={[16, 16]}>
          {filtered.map((g) => (
            <Col xs={24} sm={12} md={8} lg={6} key={g.ID}>
              <Card
                hoverable
                onClick={() => navigate(`/workshop/${g.ID}`)}
                style={{ background: "#1f1f1f", borderRadius: 8 }}
                cover={
                  g.img_src ? (
                    <img
                      alt={g.game_name}
                      src={g.img_src}
                      style={{ height: 120, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 120,
                        background: "#2a2a2a",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#888",
                        fontSize: 24,
                      }}
                    >
                      <PictureOutlined />
                    </div>
                  )
                }
              >
                <Text style={{ color: "white" }}>{g.game_name}</Text>
              </Card>
            </Col>
          ))}
        </Row>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Pagination defaultCurrent={1} total={filtered.length} pageSize={8} />
        </div>
      </Content>

      {/* Sidebar */}
      <Sider
        width={200}
        style={{
          background: "#141414",
          padding: "20px",
          borderLeft: "1px solid #2a2a2a",
        }}
      >
        <h3 style={{ color: "white" }}>Menu</h3>
        <List
          dataSource={[
            { name: "All Workshops", key: "all" },
            { name: "Your Games", key: "your-games" },
          ]}
          renderItem={(item) => (
            <List.Item
              style={{
                color: "white",
                cursor: "pointer",
                border: "none",
                padding: "8px 12px",
                marginBottom: 4,
                borderRadius: 6,
                background:
                  activeMenu === item.key ? "#1890ff33" : "transparent", // highlight
                borderLeft:
                  activeMenu === item.key ? "3px solid #1890ff" : "3px solid transparent", // กรอบข้างซ้าย
                transition: "all 0.2s",
              }}
              onClick={() => setActiveMenu(item.key)} // 👈 เปลี่ยนเมนู
            >
              {item.name}
            </List.Item>
          )}
        />
      </Sider>
    </Layout>
  );
};

export default WorkshopMain;
