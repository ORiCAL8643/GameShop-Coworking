import React, { useState, useEffect, useMemo } from "react";
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
  Select,
} from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { getGame, listMods, listGames, listUserGames } from "../../services/workshop";
import type { Game, Mod } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Content, Sider, Header } = Layout;
const { Text } = Typography;
const { Search } = Input;

const WorkshopDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { id: rawUserId } = useAuth() as { id?: number | string };

  // antd v5: useMessage ให้ toast แสดงแน่นอน
  const [msg, contextHolder] = message.useMessage();

  const userId = useMemo(() => (rawUserId != null ? Number(rawUserId) : undefined), [rawUserId]);

  const [game, setGame] = useState<Game | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filteredMods, setFilteredMods] = useState<Mod[]>([]);
  const [userGames, setUserGames] = useState<number[]>([]); // game_id list ที่ผู้ใช้มี

  // 🆕 Sort
  const [sortKey, setSortKey] = useState<"views" | "downloads">("views");

  // โหลดข้อมูลเกมและม็อด
  useEffect(() => {
    if (!id) return;
    const gameId = Number(id);

    (async () => {
      try {
        const g = await getGame(gameId);
        setGame(g);
      } catch {
        try {
          const all = await listGames();
          const found = all.find((x: any) => (x?.ID ?? x?.id) === gameId) || null;
          setGame(found as Game | null);
        } catch (e) {
          console.error(e);
        }
      }
    })();

    listMods(gameId)
      .then((ms) => {
        setMods(ms);
        setFilteredMods(ms);
      })
      .catch((e) => {
        console.warn("listMods failed or not implemented:", e);
        setMods([]);
        setFilteredMods([]);
      });
  }, [id]);

  // โหลดรายการเกมที่ผู้ใช้มี
  useEffect(() => {
    if (!userId) return;
    listUserGames(userId)
      .then((rows: any[]) => {
        const ids = (rows ?? [])
          .map((r) => Number(r.game_id ?? r.gameId ?? r.GameID))
          .filter((n) => Number.isFinite(n)) as number[];
        setUserGames(ids);
      })
      .catch(console.error);
  }, [userId]);

  const handleUpload = () => {
    const gid = (game as any)?.ID ?? (game as any)?.id;

    if (!game || !gid) {
      msg.error({ content: "ไม่พบข้อมูลเกม", duration: 2 });
      return;
    }
    if (!userId) {
      msg.error({ content: "กรุณาเข้าสู่ระบบก่อนอัปโหลดม็อด", duration: 2 });
      return;
    }

    const isOwner = userGames.includes(Number(gid));
    if (!isOwner) {
      msg.error({
        content: "ไม่สามารถอัปโหลดม็อดของเกมนี้ได้ เนื่องจากคุณไม่ได้เป็นเจ้าของเกมนี้",
        duration: 2.5,
      });
      return; // ไม่พาไปหน้าอัปโหลด
    }

    // เป็นเจ้าของ → ไปหน้าอัปโหลด
    navigate(`/upload?gameId=${gid}`);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    const result = mods.filter((m) => (m.title ?? "").toLowerCase().includes(value.toLowerCase()));
    setFilteredMods(result);
  };

  useEffect(() => {
    setFilteredMods(mods);
  }, [mods]);

  // ใช้ค่านี้เพื่อปรับสไตล์ปุ่ม (กดได้เสมอ แต่ถ้าไม่เป็นเจ้าของทำให้อ่อนลงนิดหน่อย)
  const isOwner = useMemo(() => {
    const gid = (game as any)?.ID ?? (game as any)?.id;
    return gid != null && userGames.includes(Number(gid));
  }, [game, userGames]);

  // helper: หา url รูปของม็อดอย่างปลอดภัย
  const getModImg = (m: any): string =>
    m?.image_path ?? m?.image ?? m?.imageUrl ?? m?.img_src ?? "";

  const bannerImg = (game as any)?.img_src ?? "";

  // 🆕 Helpers สำหรับดึงค่าดู/ดาวน์โหลดให้ robust
  const getViews = (m: any) =>
    Number(m.view_count ?? m.views ?? m.viewCount ?? m.Views ?? 0);
  const getDownloads = (m: any) =>
    Number(m.downloads ?? m.download_count ?? m.downloadCount ?? m.Downloads ?? 0);

  // 🆕 รายการหลังจัดเรียง
  const sortedMods = useMemo(() => {
    const modsCopy = [...filteredMods];
    modsCopy.sort((a, b) => {
      const av = sortKey === "views" ? getViews(a) : getDownloads(a);
      const bv = sortKey === "views" ? getViews(b) : getDownloads(b);
      return bv - av; // มาก → น้อย
    });
    return modsCopy;
  }, [filteredMods, sortKey]);

  return (
    <Layout style={{ background: "#0f1419", minHeight: "100vh" }}>
      {/* toast context */}
      {contextHolder}

      {/* ===== Hero Banner สไตล์ Steam ===== */}
      <Header
        style={{
          background: "#0f1419",
          padding: 0,
          height: 340,
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid #1f2933",
        }}
      >
        {/* พื้นหลังรูปแบบเบลอ/จาง */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: bannerImg ? `url(${bannerImg})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(16px)",
            transform: "scale(1.2)",
            opacity: 0.35,
          }}
        />
        {/* ไล่เฉดทับให้อ่านง่าย */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(15,20,25,0.3) 0%, rgba(15,20,25,0.75) 60%, rgba(15,20,25,0.95) 100%)",
          }}
        />
        {/* เนื้อหาแบนเนอร์ */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "grid",
            gridTemplateColumns: "1fr minmax(260px, 380px)",
            gap: 20,
            alignItems: "center",
            padding: "24px 28px",
          }}
        >
          {/* ซ้าย: ชื่อเกม + สถิติ */}
          <div>
            <div
              style={{
                color: "#fff",
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1.2,
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                marginBottom: 8,
              }}
            >
              {game?.game_name || "Untitled Game"}
            </div>
            <div style={{ color: "#c9d1d9" }}>
              <span style={{ fontSize: 14 }}>
                {filteredMods.length} {filteredMods.length === 1 ? "mod" : "mods"} available
              </span>
            </div>

            {/* Search วางในแบนเนอร์ */}
            <div style={{ marginTop: 16, maxWidth: 380 }}>
              <Search
                placeholder="Search mods..."
                allowClear
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                onSearch={handleSearch}
              />
            </div>
          </div>

          {/* ขวา: ปกเกมชัดๆ */}
          <div
            style={{
              justifySelf: "end",
              width: "100%",
              maxWidth: 380,
              height: 240,
              borderRadius: 12,
              overflow: "hidden",
              background: "#1f2933",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
              border: "1px solid #2b3a42",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {bannerImg ? (
              <img
                src={bannerImg}
                alt={game?.game_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  color: "#8899a6",
                  fontSize: 32,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <PictureOutlined />
                No cover image
              </div>
            )}
          </div>
        </div>
      </Header>

      <Layout>
        {/* Content */}
        <Content style={{ padding: "20px" }}>
          {/* 🆕 Toolbar: Sort by */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span style={{ color: "#bfbfbf" }}>Sort by</span>
            <Select<"views" | "downloads">
              value={sortKey}
              onChange={(v) => setSortKey(v)}
              style={{ width: 220 }}
              options={[
                { value: "views", label: "Most viewed" },
                { value: "downloads", label: "Most downloaded" },
              ]}
            />
          </div>

          {/* Grid Mods */}
          <Row gutter={[16, 16]}>
            {sortedMods.map((mod) => {
              const modImg = getModImg(mod);
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={mod.ID}>
                  <Card
                    hoverable
                    style={{
                      background: "#1a1a1a",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #262626",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                    }}
                    bodyStyle={{ padding: 0 }}
                    cover={
                      modImg ? (
                        <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
                          <img
                            alt={mod.title}
                            src={modImg}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              transform: "scale(1.02)",
                              transition: "transform .3s ease",
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.02)")}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.75) 100%)",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 180,
                            background: "linear-gradient(135deg, #2b2b2b 0%, #1f1f1f 100%)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "#888",
                            fontSize: 32,
                          }}
                        >
                          <PictureOutlined />
                        </div>
                      )
                    }
                    onClick={() => navigate(`/mod/${mod.ID}`)}
                  >
                    {/* body: พื้นหลังภาพแบบจาง+เบลอ */}
                    <div
                      style={{
                        position: "relative",
                        padding: "12px 14px 14px",
                        minHeight: 70,
                        overflow: "hidden",
                        borderTop: "1px solid #262626",
                      }}
                    >
                      <div
                        aria-hidden
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage: modImg ? `url(${modImg})` : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          filter: "blur(12px)",
                          transform: "scale(1.2)",
                          opacity: 0.25,
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
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 15,
                            lineHeight: 1.25,
                          }}
                        >
                          {mod.title}
                        </Text>
                        {/* 🆕 แสดงสถิติ (ถ้ามี) เล็ก ๆ ใต้ชื่อ */}
                        <div style={{ color: "#9aa4ad", fontSize: 12, marginTop: 4 }}>
                          {(() => {
                            const v = getViews(mod);
                            const d = getDownloads(mod);
                            const parts = [
                              Number.isFinite(v) ? `${v} views` : null,
                              Number.isFinite(d) ? `${d} downloads` : null,
                            ].filter(Boolean);
                            return parts.length ? parts.join(" • ") : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}

            {sortedMods.length === 0 && (
              <Col span={24} style={{ textAlign: "center", color: "#aaa" }}>
                No mods found.
              </Col>
            )}
          </Row>
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
          <h3 style={{ color: "white" }}>Browse Items</h3>
          <List
            dataSource={[{ name: "All", key: "all" as const }]}
            renderItem={(item) => (
              <List.Item
                style={{
                  color: "white",
                  cursor: "default",
                  border: "none",
                  padding: "8px 12px",
                  marginBottom: 4,
                  borderRadius: 6,
                  background: "#1890ff33", // ✅ active ตลอด
                  borderLeft: "3px solid #1890ff",
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                {item.name}
              </List.Item>
            )}
          />

          <Button
            type="primary"
            block
            style={{ marginTop: 20, opacity: isOwner ? 1 : 0.85 }}
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
