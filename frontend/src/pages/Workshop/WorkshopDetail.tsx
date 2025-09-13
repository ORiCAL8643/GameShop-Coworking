// src/pages/Workshop/WorkshopDetail.tsx
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
  ConfigProvider,
  theme,
} from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { getGame, listMods, listGames, listUserGames } from "../../services/workshop";
import type { Game, Mod } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Content, Sider, Header } = Layout;
const { Text } = Typography;
const { Search } = Input;

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? "http://localhost:8088";

const resolveImgUrl = (src?: string) => {
  if (!src) return "";
  const s = src.replace(/\\/g, "/");
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
  const clean = s.startsWith("/") ? s.slice(1) : s;
  return `${API_BASE}/${clean}`;
};

type FilterKey = "all" | "mine";

const WorkshopDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { id: rawUserId } = useAuth() as { id?: number | string };

  const [msgCtx, contextHolder] = message.useMessage();
  const userId = useMemo(() => (rawUserId != null ? Number(rawUserId) : undefined), [rawUserId]);

  const [game, setGame] = useState<Game | null>(null);
  const [mods, setMods] = useState<Mod[]>([]);
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<"views" | "downloads">("views");

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [myUserGameIds, setMyUserGameIds] = useState<number[]>([]);

  // เป็นเจ้าของเกมนี้ไหม
  const [ownsThisGame, setOwnsThisGame] = useState<boolean>(false);
  const [checkingOwn, setCheckingOwn] = useState<boolean>(false);

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
      .then((ms) => setMods(ms || []))
      .catch((e) => {
        console.warn("listMods failed:", e);
        setMods([]);
      });
  }, [id]);

  // โหลด user-games แล้วเช็ค own
  useEffect(() => {
    const gameId = Number(id);
    if (!userId || !gameId) {
      setMyUserGameIds([]);
      setOwnsThisGame(false);
      return;
    }
    setCheckingOwn(true);
    listUserGames(userId)
      .then((rows: any[]) => {
        const ugIds = (rows ?? [])
          .map((r) => Number(r.id ?? r.ID ?? r.user_game_id ?? r.UserGameID))
          .filter((n) => Number.isFinite(n)) as number[];
        setMyUserGameIds(ugIds);

        const owns = (rows ?? []).some(
          (r: any) => Number(r.game_id ?? r.gameId ?? r.GameID) === gameId
        );
        setOwnsThisGame(owns);
      })
      .catch((e) => {
        console.warn("listUserGames failed:", e);
        setMyUserGameIds([]);
        setOwnsThisGame(false);
      })
      .finally(() => setCheckingOwn(false));
  }, [userId, id]);

  const handleUpload = () => {
    const gid = (game as any)?.ID ?? (game as any)?.id;

    if (!game || !gid) {
      msgCtx.error({ content: "ไม่พบข้อมูลเกม", duration: 2 });
      return;
    }
    if (!userId) {
      msgCtx.error({ content: "กรุณาเข้าสู่ระบบก่อนอัปโหลดม็อด", duration: 2 });
      return;
    }
    if (checkingOwn) {
      msgCtx.loading({ content: "กำลังตรวจสอบสิทธิ์...", duration: 1 });
      return;
    }
    if (!ownsThisGame) {
      msgCtx.error({ content: "ต้องเป็นเจ้าของเกมนี้ก่อนจึงจะอัปโหลดม็อดได้", duration: 2 });
      return;
    }

    navigate(`/workshop/upload?gameId=${gid}`);
  };

  const handleSearch = (value: string) => setSearchText(value);

  const getModImg = (m: any): string => {
    const raw =
      m?.image_path ??
      m?.ImagePath ??
      m?.imageUrl ??
      m?.ImageURL ??
      m?.image ??
      m?.img_src ??
      m?.img ??
      "";
    return resolveImgUrl(raw);
  };

  const bannerImg = resolveImgUrl(
    (game as any)?.img_src ??
      (game as any)?.image_path ??
      (game as any)?.ImagePath ??
      (game as any)?.cover ??
      ""
  );

  const getViews = (m: any) =>
    Number(m.view_count ?? m.views ?? m.viewCount ?? m.Views ?? 0);
  const getDownloads = (m: any) =>
    Number(m.downloads ?? m.download_count ?? m.downloadCount ?? m.Downloads ?? 0);

  const extractUploaderId = (m: any): number | undefined => {
    const cand =
      m?.user_id ??
      m?.UserID ??
      m?.uploader_id ??
      m?.UploaderID ??
      m?.author_id ??
      m?.AuthorID ??
      m?.owner_id ??
      m?.OwnerID;
    const n = Number(cand);
    return Number.isFinite(n) ? n : undefined;
  };
  const extractUserGameId = (m: any): number | undefined => {
    const cand = m?.user_game_id ?? m?.UserGameID ?? m?.userGameId;
    const n = Number(cand);
    return Number.isFinite(n) ? n : undefined;
  };
  const isMine = (m: any): boolean => {
    if (!userId) return false;
    const uid = extractUploaderId(m);
    if (uid && uid === Number(userId)) return true;
    const ugid = extractUserGameId(m);
    if (ugid && myUserGameIds.includes(ugid)) return true;
    return false;
  };

  const filteredMods = useMemo(() => {
    let base = mods.slice();
    if (activeFilter === "mine") base = base.filter(isMine);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      base = base.filter((m: any) => (m.title ?? "").toLowerCase().includes(q));
    }
    return base;
  }, [mods, activeFilter, searchText, userId, myUserGameIds]);

  const sortedMods = useMemo(() => {
    const modsCopy = [...filteredMods];
    modsCopy.sort((a, b) => {
      const av = sortKey === "views" ? getViews(a) : getDownloads(a);
      const bv = sortKey === "views" ? getViews(b) : getDownloads(b);
      return bv - av;
    });
    return modsCopy;
  }, [filteredMods, sortKey]);

  const itemStyle = (active: boolean): React.CSSProperties => ({
    color: active ? "white" : "#d0d0d0",
    cursor: "pointer",
    border: "none",
    padding: "8px 12px",
    marginBottom: 4,
    borderRadius: 6,
    background: active ? "#1890ff33" : "transparent",
    borderLeft: active ? "3px solid #1890ff" : "3px solid transparent",
    fontWeight: active ? 600 : 500,
    transition: "all 0.2s",
  });

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgBase: "#0f1419",
          colorBgContainer: "#1a1a1a",
          colorBgElevated: "#141414",
          colorBorder: "#2a2a2a",
          colorText: "#e6e6e6",
          colorTextPlaceholder: "#9aa4ad",
          controlItemBgHover: "#1e293b",
          colorPrimary: "#1890ff",
        },
      }}
    >
      {/* CSS เสริมให้ Select มืดสนิท */}
      <style>{`
        .ws-dark-select .ant-select-selector {
          background: #1f1f1f !important;
          border-color: #2a2a2a !important;
          color: #fff !important;
        }
        .ws-dark-select .ant-select-selection-placeholder { color: #9aa4ad !important; }
        .ws-dark-select .ant-select-arrow { color: #9aa4ad !important; }
        .ws-dark-dropdown .ant-select-item { color: #e6e6e6; }
        .ws-dark-dropdown { background: #1f1f1f !important; }
      `}</style>

      <Layout style={{ background: "#0f1419", minHeight: "100vh" }}>
        {contextHolder}

        {/* Banner */}
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
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(15,20,25,0.3) 0%, rgba(15,20,25,0.75) 60%, rgba(15,20,25,0.95) 100%)",
            }}
          />
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

              <div style={{ marginTop: 16, maxWidth: 380 }}>
                <Search
                  placeholder="Search mods..."
                  allowClear
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  onSearch={handleSearch}
                  style={{ background: "#1f1f1f", borderColor: "#2a2a2a", color: "#fff" }}
                />
              </div>
            </div>

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
          <Content style={{ padding: "20px" }}>
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
                className="ws-dark-select"
                popupClassName="ws-dark-dropdown"
                options={[
                  { value: "views", label: "Most viewed" },
                  { value: "downloads", label: "Most downloaded" },
                ]}
              />
            </div>

            <Row gutter={[16, 16]}>
              {sortedMods.map((mod) => {
                const modImg = getModImg(mod);
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={mod.ID ?? (mod as any)?.id}>
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
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.02)")
                              }
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
                      onClick={() => navigate(`/mod/${mod.ID ?? (mod as any)?.id}`)}
                    >
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
              dataSource={[
                { name: "All", key: "all" as const },
                { name: "My uploads", key: "mine" as const },
              ]}
              renderItem={(item) => (
                <List.Item
                  style={itemStyle(activeFilter === item.key)}
                  onClick={() => setActiveFilter(item.key)}
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
              disabled={!userId || checkingOwn || !ownsThisGame}
            >
              Upload Mod
            </Button>

            {!userId && (
              <div style={{ marginTop: 8, color: "#bbb", fontSize: 12 }}>
                กรุณาเข้าสู่ระบบเพื่ออัปโหลดม็อด
              </div>
            )}
            {userId && !checkingOwn && !ownsThisGame && (
              <div style={{ marginTop: 8, color: "#bbb", fontSize: 12 }}>
                ต้องเป็นเจ้าของเกมนี้ก่อนจึงจะอัปโหลดม็อดได้
              </div>
            )}
          </Sider>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default WorkshopDetail;
