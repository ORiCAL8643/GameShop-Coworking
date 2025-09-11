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
import { listGames, listUserGames, listMods } from "../../services/workshop";
import type { Game, Mod } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Content, Sider } = Layout;
const { Text } = Typography;
const { Search } = Input;

const WorkshopMain: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState<"all" | "your-games">("all");
  const [games, setGames] = useState<Game[]>([]);          // ✅ เริ่มเป็น []
  const [yourGames, setYourGames] = useState<number[]>([]);
  const [modCounts, setModCounts] = useState<Record<number, number>>({});

  const navigate = useNavigate();
  const { id: userId } = useAuth();

  useEffect(() => {
    // ดึงรายชื่อเกม
    listGames()
      .then((data: any) => setGames(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [])) // ✅ normalize
      .catch((e) => {
        console.warn("listGames failed:", e);
        setGames([]); // fallback
      });

    // ดึงม็อดทั้งหมดแล้วนับต่อเกม
    listMods()
      .then((mods: Mod[]) => {
        const arr = Array.isArray(mods) ? mods : Array.isArray((mods as any)?.items) ? (mods as any).items : [];
        const counts: Record<number, number> = {};
        for (const m of arr) {
          const gid = Number((m as any)?.game_id ?? (m as any)?.gameId ?? (m as any)?.GameID);
          if (Number.isFinite(gid)) counts[gid] = (counts[gid] || 0) + 1;
        }
        setModCounts(counts);
      })
      .catch((e) => {
        console.warn("listMods failed or not implemented:", e);
        setModCounts({});
      });

    // เกมของผู้ใช้
    if (userId) {
      listUserGames(Number(userId))
        .then((rows: any[]) => {
          const arr = Array.isArray(rows) ? rows : [];
          const ids = arr
            .map((r) => Number(r.game_id ?? r.gameId ?? r.GameID))
            .filter((n) => Number.isFinite(n)) as number[];
          setYourGames(ids);
        })
        .catch((e) => {
          console.warn("listUserGames failed:", e);
          setYourGames([]);
        });
    } else {
      setYourGames([]); // guest
    }
  }, [userId]);

  // ✅ เผื่อกรณี games ไม่ใช่อาเรย์
  const baseGames: Game[] = Array.isArray(games) ? games : [];

  const filtered = baseGames.filter((g) => {
    const name = (g as any)?.game_name ?? (g as any)?.name ?? "";
    const matchesSearch = String(name).toLowerCase().includes(search.toLowerCase());
    if (activeMenu === "your-games") {
      const gid = Number((g as any).ID ?? (g as any).id);
      return yourGames.includes(gid) && matchesSearch;
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
          {filtered.map((g) => {
            const gid = (g as any).ID ?? (g as any).id;
            const count = modCounts[gid] ?? 0;
            const img = g.img_src || ""; // ถ้าไม่มี จะใช้ placeholder box ด้านล่างแทน

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={gid}>
                <Card
                  hoverable
                  onClick={() => navigate(`/workshop/${gid}`)}
                  style={{
                    background: "#1a1a1a",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #262626",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                  }}
                  bodyStyle={{ padding: 0 }}
                  cover={
                    img ? (
                      <div
                        style={{
                          height: 220, // ✅ ภาพใหญ่ขึ้น
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          alt={g.game_name}
                          src={img}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: "scale(1.05)",
                            transition: "transform .35s ease",
                          }}
                          onLoad={(e) => {
                            // ปรับลด scale หลังโหลดเพื่อให้โฮเวอร์ดู smooth
                            (e.currentTarget as HTMLImageElement).style.transform = "scale(1.0)";
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLImageElement).style.transform = "scale(1.03)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLImageElement).style.transform = "scale(1.0)";
                          }}
                        />
                        {/* เงาด้านล่างเพื่ออ่านชื่อชัด */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.7) 100%)",
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          height: 220, // ✅ ความสูงเท่ากันแม้ไม่มีรูป
                          background:
                            "linear-gradient(135deg, #2b2b2b 0%, #1f1f1f 100%)",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#888",
                          fontSize: 40,
                        }}
                      >
                        <PictureOutlined />
                      </div>
                    )
                  }
                >
                  {/* ✅ เนื้อหาพร้อมพื้นหลังรูปแบบจางๆ + เบลอ สไตล์ Steam */}
                  <div
                    style={{
                      position: "relative",
                      padding: "14px 16px 16px",
                      minHeight: 84,
                      overflow: "hidden",
                      borderTop: "1px solid #262626",
                    }}
                  >
                    {/* ชั้นพื้นหลัง: ใช้รูปเดิมแบบเบลอและจาง */}
                    <div
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: img ? `url(${img})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "blur(14px)",
                        transform: "scale(1.2)",
                        opacity: 0.28,
                      }}
                    />
                    {/* ไล่เฉดทับอีกชั้นให้อ่านง่าย */}
                    <div
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(0deg, rgba(20,20,20,0.95) 0%, rgba(20,20,20,0.85) 60%, rgba(20,20,20,0.6) 100%)",
                      }}
                    />

                    {/* เนื้อหาจริง */}
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 16,
                            lineHeight: 1.2,
                          }}
                        >
                          {g.game_name}
                        </Text>
                      </div>

                      <Text
                        type="secondary"
                        style={{ color: "#bfbfbf", fontSize: 12 }}
                      >
                        {count} {count === 1 ? "item" : "items"}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
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
            { name: "All Workshops", key: "all" as const },
            { name: "Your Games", key: "your-games" as const },
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
                  activeMenu === item.key ? "#1890ff33" : "transparent",
                borderLeft:
                  activeMenu === item.key
                    ? "3px solid #1890ff"
                    : "3px solid transparent",
                transition: "all 0.2s",
              }}
              onClick={() => setActiveMenu(item.key)}
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
