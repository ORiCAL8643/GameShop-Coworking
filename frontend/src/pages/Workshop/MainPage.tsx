import React, { useState, useEffect, useMemo } from "react";
import {
  Card, Row, Col, Typography, Pagination, Input, Layout, List, Spin, Empty
} from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listGames, listUserGames, listMods } from "../../services/workshop";
import type { Game } from "../../interfaces"; // ⬅️ ลบ Mod เพราะไม่ได้ใช้
import { useAuth } from "../../context/AuthContext";

const { Content, Sider } = Layout;
const { Text } = Typography;
const { Search } = Input;

const API_BASE = "http://localhost:8088";

// แปลง path เป็น absolute เสมอ
const resolveImgUrl = (src?: string) => {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:image/")) return src;
  const clean = src.startsWith("/") ? src.slice(1) : src;
  return `${API_BASE}/${clean}`;
};

const PAGE_SIZE = 8;

const WorkshopMain: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState<"all" | "your-games">("all");
  const [games, setGames] = useState<Game[]>([]);
  const [yourGames, setYourGames] = useState<number[]>([]);
  const [modCounts, setModCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const navigate = useNavigate();
  const { id: userId } = useAuth();

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      try {
        // games
        const g = await listGames();
        if (!alive) return;
        setGames(Array.isArray(g) ? g : Array.isArray((g as any)?.items) ? (g as any).items : []);

        // mods → นับต่อเกม
        const mods = await listMods();
        if (!alive) return;
        const arr = Array.isArray(mods) ? mods : Array.isArray((mods as any)?.items) ? (mods as any).items : [];
        const counts: Record<number, number> = {};
        for (const m of arr) {
          const gid = Number((m as any)?.game_id ?? (m as any)?.gameId ?? (m as any)?.GameID);
          if (Number.isFinite(gid)) counts[gid] = (counts[gid] || 0) + 1;
        }
        setModCounts(counts);

        // user-owned games
        if (userId) {
          const rows = await listUserGames(Number(userId));
          if (!alive) return;
          const ids = (rows ?? [])
            .map((r: any) => Number(r.game_id ?? r.gameId ?? r.GameID))
            .filter((n: any) => Number.isFinite(n)) as number[];
          setYourGames(ids);
        } else {
          setYourGames([]);
        }
      } catch (e) {
        console.warn("load workshop main failed:", e);
        setGames([]);
        setModCounts({});
        setYourGames([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [userId]);

  // กรองตาม search + your-games
  const filtered = useMemo(() => {
    const src = Array.isArray(games) ? games : [];
    const lower = search.toLowerCase();
    return src.filter((g: any) => {
      const name = String(g?.game_name ?? g?.name ?? "");
      const matchesSearch = name.toLowerCase().includes(lower);
      if (activeMenu === "your-games") {
        const gid = Number(g?.ID ?? g?.id);
        return yourGames.includes(gid) && matchesSearch;
      }
      return matchesSearch;
    });
  }, [games, search, activeMenu, yourGames]);

  // ตัดหน้า
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = filtered.slice(start, end);

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
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onSearch={(v) => { setSearch(v); setPage(1); }}
            style={{ maxWidth: 400 }}
          />
        </div>

        <Spin spinning={loading}>
          {(!loading && pageItems.length === 0) ? (
            <Empty description="ไม่พบรายการ" style={{ color: "#fff" }} />
          ) : (
            <Row gutter={[16, 16]}>
              {pageItems.map((g: any) => {
                const gid = g?.ID ?? g?.id;
                const count = modCounts[gid] ?? 0;
                const img = resolveImgUrl(g?.img_src);

                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={gid}>
                    <Card
                      hoverable
                      onClick={() => { if (gid) navigate(`/workshop/${gid}`); }}
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
                          <div style={{ height: 220, position: "relative", overflow: "hidden" }}>
                            <img
                              alt={g?.game_name ?? "cover"}
                              src={img}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: "scale(1.05)",
                                transition: "transform .35s ease",
                              }}
                              onLoad={(e) => {
                                (e.currentTarget as HTMLImageElement).style.transform = "scale(1.0)";
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLImageElement).style.transform = "scale(1.03)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLImageElement).style.transform = "scale(1.0)";
                              }}
                            />
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
                              height: 220,
                              background: "linear-gradient(135deg, #2b2b2b 0%, #1f1f1f 100%)",
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
                      <div
                        style={{
                          position: "relative",
                          padding: "14px 16px 16px",
                          minHeight: 84,
                          overflow: "hidden",
                          borderTop: "1px solid #262626",
                        }}
                      >
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
                        <div
                          aria-hidden
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(0deg, rgba(20,20,20,0.95) 0%, rgba(20,20,20,0.85) 60%, rgba(20,20,20,0.6) 100%)",
                          }}
                        />
                        <div style={{ position: "relative", zIndex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <Text style={{ color: "#fff", fontWeight: 600, fontSize: 16, lineHeight: 1.2 }}>
                              {g?.game_name ?? g?.name}
                            </Text>
                          </div>
                          <Text type="secondary" style={{ color: "#bfbfbf", fontSize: 12 }}>
                            {count} {count === 1 ? "item" : "items"}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Spin>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
          />
        </div>
      </Content>

      <Sider
        width={200}
        style={{ background: "#141414", padding: "20px", borderLeft: "1px solid #2a2a2a" }}
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
                background: activeMenu === item.key ? "#1890ff33" : "transparent",
                borderLeft: activeMenu === item.key ? "3px solid #1890ff" : "3px solid transparent",
                transition: "all 0.2s",
              }}
              onClick={() => { setActiveMenu(item.key); setPage(1); }}
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