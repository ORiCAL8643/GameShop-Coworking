import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Select,
} from "antd";
import { PictureOutlined } from "@ant-design/icons";

const { Content, Sider, Header } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface WorkshopItem {
  id: number;
  title: string;
  items: number;
  image?: string;
}

interface ModItem {
  id: number;
  title: string;
  author?: string;
  downloads?: number;
  visitors?: number;
}

const WorkshopDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const workshop = location.state as WorkshopItem;
  const [mods, setMods] = useState<ModItem[]>([]);
  const [userGameIds, setUserGameIds] = useState<number[]>([]);

  // state สำหรับ search และ sort
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<string>("downloads");
  const [filteredMods, setFilteredMods] = useState<ModItem[]>([]);

  const handleUpload = () => {
    if (userGameIds.includes(workshop.id)) {
      navigate(`/upload?gameId=${workshop.id}`);
    } else {
      message.error("คุณไม่มีเกมนี้ ไม่สามารถอัปโหลดม็อดได้");
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    filterAndSort(value, sortBy);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    filterAndSort(searchText, value);
  };

  // ฟังก์ชันรวม search + sort
  const filterAndSort = (search: string, sort: string) => {
    let result = mods.filter(
      (m) =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.author || "").toLowerCase().includes(search.toLowerCase())
    );

    if (sort === "downloads") {
      result = [...result].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sort === "visitors") {
      result = [...result].sort((a, b) => (b.visitors || 0) - (a.visitors || 0));
    }

    setFilteredMods(result);
  };

  // fetch mods and user games
  useEffect(() => {
    const fetchMods = async () => {
      try {
        const [modRes, userGameRes] = await Promise.all([
          fetch("http://localhost:8088/mods"),
          fetch("http://localhost:8088/user-games?user_id=1"),
        ]);

        const modsData: any[] = await modRes.json();
        const modItems: ModItem[] = modsData
          .filter((m) => m.game_id === workshop.id)
          .map((m) => ({ id: m.ID, title: m.title }));
        setMods(modItems);
        setFilteredMods(modItems);

        const userGames: any[] = await userGameRes.json();
        setUserGameIds(userGames.map((ug) => ug.game_id));
      } catch (err) {
        console.error(err);
      }
    };
    fetchMods();
  }, [workshop.id]);

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
        {workshop.image ? (
          <img
            src={workshop.image}
            alt={workshop.title}
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
            Banner for {workshop.title}
          </div>
        )}
      </Header>

      <Layout>
        {/* Content */}
        <Content style={{ padding: "20px" }}>
          <Title level={3} style={{ color: "black" }}>
            {workshop.title} – {mods.length} items
          </Title>
          <Text style={{ color: "black" }}>
            Showing 1–{filteredMods.length} of {mods.length} entries
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

            {/* Label + Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Text style={{ color: "black" }}>Sort by:</Text>
              <Select
                style={{ width: 180 }}
                value={sortBy}
                onChange={handleSortChange}
              >
                <Option value="downloads">Most Downloads</Option>
                <Option value="visitors">Most Visitors</Option>
              </Select>
            </div>
          </div>

          {/* Grid Mods */}
          <Row gutter={[16, 16]}>
            {filteredMods.map((mod) => (
              <Col xs={24} sm={12} md={8} lg={6} key={mod.id}>
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
                  onClick={() => navigate(`/mod/${mod.id}`, { state: mod })}
                >
                  <Text style={{ color: "white" }}>{mod.title}</Text>
                  <br />
                  <Text type="secondary" style={{ color: "#aaa" }}>
                    by {mod.author}
                  </Text>
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
