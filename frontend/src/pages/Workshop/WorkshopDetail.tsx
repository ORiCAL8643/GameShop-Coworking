import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Typography,
  Input,
  Row,
  Col,
  Card,
  List,
  Button,
  message,
} from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { getGame, listMods, listUserGames } from "../../services/workshop";
import type { Game, Mod } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Content, Sider, Header } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const WorkshopDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { id: userId } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filteredMods, setFilteredMods] = useState<Mod[]>([]);
  const [userGames, setUserGames] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      const gameId = Number(id);
      getGame(gameId).then(setGame).catch(console.error);
      listMods(gameId).then((ms) => {
        setMods(ms);
        setFilteredMods(ms);
      });
    }
  }, [id]);

  useEffect(() => {
    if (userId) {
      listUserGames(userId)
        .then((rows) => setUserGames(rows.map((r) => r.game_id)))
        .catch(console.error);
    }
  }, [userId]);

  const handleUpload = () => {
    if (game && userGames.includes(game.ID)) {
      navigate(`/upload?gameId=${game.ID}`);
    } else {
      message.error("คุณไม่มีเกมนี้ ไม่สามารถอัปโหลดม็อดได้");
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    const result = mods.filter((m) =>
      m.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMods(result);
  };

  useEffect(() => {
    setFilteredMods(mods);
  }, [mods]);

  return (
    <Layout style={{ background: "#0f1419", minHeight: "100vh" }}>
      {/* Header Banner */}
      <Header
        style={{
          background: "#1f1f1f",
          padding: 0,
          height: 200,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {game?.img_src ? (
          <img
            src={game.img_src}
            alt={game.game_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "90%",
              height: "100%",
              background: "#2a2a2a",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#888",
              fontSize: 20,
            }}
          >
            <PictureOutlined style={{ fontSize: 40, marginRight: 10 }} />
            Banner for {game?.game_name || ""}
          </div>
        )}
      </Header>

      <Layout>
        {/* Content */}
        <Content style={{ padding: "20px" }}>
          <Title level={3} style={{ color: "black" }}>
            {game?.game_name}
          </Title>
          <Text style={{ color: "black" }}>
            Showing {filteredMods.length} mods
          </Text>

          {/* Search + Sort */}
          <div
            style={{
              marginTop: 20,
              marginBottom: 20,
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Search
              placeholder="Search mods..."
              allowClear
              style={{ maxWidth: 250 }}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
            />
          </div>

          {/* Grid Mods */}
          <Row gutter={[16, 16]}>
            {filteredMods.map((mod) => (
              <Col xs={24} sm={12} md={8} lg={6} key={mod.ID}>
                <Card
                  hoverable
                  style={{ background: "#1f1f1f", borderRadius: 8 }}
                  cover={
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
                  }
                  onClick={() => navigate(`/mod/${mod.ID}`)}
                >
                  <Text style={{ color: "white" }}>{mod.title}</Text>
                </Card>
              </Col>
            ))}

            {filteredMods.length === 0 && (
              <Col span={24} style={{ textAlign: "center", color: "#aaa" }}>
                No mods found.
              </Col>
            )}
          </Row>
        </Content>

        {/* Sidebar */}
        <Sider
          width={220}
          style={{
            background: "#141414",
            padding: "20px",
            borderLeft: "1px solid #2a2a2a",
          }}
        >
          <h3 style={{ color: "white" }}>SHOW:</h3>
          <List
            dataSource={[
              { name: "All", path: "#" },
              { name: "Your Favorites", path: "#" },
            ]}
            renderItem={(item) => (
              <List.Item
                style={{
                  color: "white",
                  cursor: "pointer",
                  border: "none",
                  padding: "8px 0",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget.style.color = "#40a9ff"))
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget.style.color = "white"))
                }
              >
                {item.name}
              </List.Item>
            )}
          />

          <Button
            type="primary"
            block
            style={{ marginTop: 20 }}
            onClick={handleUpload}
          >
            Upload Mod
          </Button>
        </Sider>
      </Layout>
    </Layout>
  );
};

export default WorkshopDetail;
