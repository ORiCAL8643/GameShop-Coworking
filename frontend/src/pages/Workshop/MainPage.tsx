import React, { useState } from "react";
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

const { Content, Sider } = Layout;
const { Text } = Typography;
const { Search } = Input;

interface WorkshopItem {
  id: string;
  title: string;
  items: number;
  image?: string;
}

const WorkshopMain: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState("all"); // 👈 เก็บเมนูปัจจุบัน
  const navigate = useNavigate();

  const workshops: WorkshopItem[] = [
    { id: "1", title: "Magneta Box", items: 9, image: "" },
    { id: "2", title: "Carbrix", items: 2, image: "" },
    { id: "3", title: "New Day", items: 81, image: "" },
    { id: "4", title: "Exospace", items: 6, image: "" },
    { id: "5", title: "Your Boy", items: 6, image: "" },
    { id: "6", title: "Nijima", items: 20, image: "" },
    { id: "7", title: "Centoo Rescue", items: 8, image: "" },
    { id: "8", title: "Tamako", items: 6, image: "" },
  ];

  // สมมุติว่าเกมที่ผู้ใช้มีจริง ๆ คือ id 1,3,5
  const yourGamesIds = ["1", "3", "5"];

  // filter ข้อมูล
  const filtered = workshops.filter((w) => {
    const matchesSearch = w.title.toLowerCase().includes(search.toLowerCase());
    if (activeMenu === "your-games") {
      return yourGamesIds.includes(w.id) && matchesSearch;
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
          {filtered.map((w) => (
            <Col xs={24} sm={12} md={8} lg={6} key={w.id}>
              <Card
                hoverable
                onClick={() => navigate(`/workshop/${w.id}`, { state: w })}
                style={{ background: "#1f1f1f", borderRadius: 8 }}
                cover={
                  w.image ? (
                    <img
                      alt={w.title}
                      src={w.image}
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
                <Text style={{ color: "white" }}>{w.title}</Text>
                <br />
                <Text type="secondary" style={{ color: "#aaa" }}>
                  {w.items} items
                </Text>
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
