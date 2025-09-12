import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Typography,
  Tag,
  Button,
  Card,
  Row,
  Col,
  Carousel,
  Skeleton,
  Divider,
  Space,
  Tooltip,
  message,
} from "antd";
import {
  HeartOutlined,
  ShoppingCartOutlined,
  PictureOutlined,
  StarFilled,
  TagsOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getGame, listMods } from "../../services/workshop";
import { findMinimumSpecForGame, type MinimumSpec } from "../../services/minimumspec";
import type { Game, Mod } from "../../interfaces";

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const API_BASE = "http://localhost:8088";

const resolveImgUrl = (src?: string) => {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:image/")) return src;
  const clean = src.startsWith("/") ? src.slice(1) : src;
  return `${API_BASE}/${clean}`;
};

const safeNum = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const asArray = (v: any): any[] =>
  Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : [];

const GameDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [game, setGame] = React.useState<Game | null>(null);
  const [mods, setMods] = React.useState<Mod[]>([]);
  const [minSpec, setMinSpec] = React.useState<MinimumSpec | null>(null);
  const [msg, ctx] = message.useMessage();

  // contexts
  const { addItem } = useCart();
  const { id: rawUserId } = useAuth() as { id?: number | string };
  const userId = React.useMemo(() => (rawUserId != null ? Number(rawUserId) : null), [rawUserId]);

  const gid = React.useMemo(() => Number(id), [id]);

  React.useEffect(() => {
    if (!gid) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        // โหลดเกม
        let g: any;
        try {
          g = await getGame(gid);
        } catch {
          const all = await (await import("../../services/workshop")).listGames();
          g = asArray(all).find((x: any) => (x?.ID ?? x?.id) === gid) || null;
        }
        if (!alive) return;
        setGame(g ?? null);

        // โหลด Minimum Spec
        try {
          const spec = g ? await findMinimumSpecForGame(g) : null;
          if (alive) setMinSpec(spec);
        } catch (e) {
          console.warn("findMinimumSpecForGame failed:", e);
          if (alive) setMinSpec(null);
        }
      } catch (e) {
        console.error(e);
        if (alive) {
          setGame(null);
          setMinSpec(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // โหลดม็อดของเกม
    listMods(gid)
      .then((rows) => alive && setMods(asArray(rows)))
      .catch(() => alive && setMods([]));

    return () => {
      alive = false;
    };
  }, [gid]);

  // รูป/สกรีนช็อต
  const coverRaw = (game as any)?.img_src || (game as any)?.cover || "";
  const cover = resolveImgUrl(coverRaw);

  const screenshots: string[] = (() => {
    const raw = (game as any)?.screenshots ?? (game as any)?.images ?? [];
    const arr = Array.isArray(raw)
      ? raw
      : typeof raw === "string"
      ? raw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    return arr.map((s) => resolveImgUrl(s));
  })();

  // ข้อความ/แท็ก
  const title = (game as any)?.game_name ?? (game as any)?.name ?? "Untitled Game";
  const desc =
    (game as any)?.description ??
    (game as any)?.detail ??
    "No description available.";

  const tags: string[] = (() => {
    const raw = (game as any)?.tags ?? (game as any)?.Genres ?? [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
    const catTitle = (game as any)?.categories?.title;
    return catTitle ? [String(catTitle)] : [];
  })();

  // ราคา/ส่วนลด
  const basePrice = safeNum((game as any)?.base_price ?? (game as any)?.price, 0);
  const discountedPrice = (game as any)?.discounted_price;
  const discountPercentField = safeNum((game as any)?.discount ?? (game as any)?.discount_percent, 0);

  let finalPrice = basePrice;
  let discountPercent = 0;

  if (typeof discountedPrice === "number" && discountedPrice < basePrice) {
    finalPrice = discountedPrice;
    discountPercent = basePrice > 0 ? Math.round((1 - discountedPrice / basePrice) * 100) : 0;
  } else if (discountPercentField > 0) {
    discountPercent = discountPercentField;
    finalPrice = Math.max(0, basePrice * (1 - discountPercent / 100));
  }

  // Minimum Spec
  const ms = minSpec ?? {};
  const os      = (ms as any).os ?? (ms as any).OS ?? "N/A";
  const cpu     = (ms as any).cpu ?? (ms as any).CPU ?? "N/A";
  const ram     = (ms as any).ram ?? (ms as any).RAM ?? "N/A";
  const gpu     = (ms as any).gpu ?? (ms as any).GPU ?? "N/A";
  const storage = (ms as any).storage ?? (ms as any).Storage ?? "N/A";

  // Top workshop items
  const topMods = React.useMemo(() => {
    const getViews = (m: any) => Number(m.view_count ?? m.views ?? m.viewCount ?? 0);
    return [...mods].sort((a, b) => getViews(b) - getViews(a)).slice(0, 8);
  }, [mods]);

  // === NEW: Purchase handler (เหมือน ProductGrid) ===
  const handlePurchase = async (e: React.MouseEvent) => {
    if (!game) return;

    const price = Number((game as any)?.discounted_price ?? (game as any)?.base_price) || 0;
    const gameId = (game as any)?.ID ?? (game as any)?.id;
    const gameKeyId = (game as any)?.key_id ?? (game as any)?.KeyGameID;

    try {
      if (userId) {
        // โฟลว์ backend order
        const res = await axios.post(`${API_BASE}/orders`, {
          user_id: Number(userId),
          total_amount: price,
          order_status: "PENDING",
          order_items: [
            {
              unit_price: price,
              qty: 1,
              game_key_id: gameKeyId, // ใช้ key ของเกมในการสั่งซื้อเหมือน ProductGrid
            },
          ],
        });
        const orderId = res?.data?.ID ?? res?.data?.id;
        if (orderId) localStorage.setItem("orderId", String(orderId));
        msg.success("สร้างออเดอร์เรียบร้อย");
      } else {
        // โฟลว์ตะกร้า local
        addItem({ id: Number(gameId), title, price, quantity: 1 });
        msg.success(`เพิ่ม ${title} ลงตะกร้าแล้ว`);
      }
    
    navigate("/category/Payment");
    } catch (err) {
      console.error("purchase error:", err);
      msg.error("ไม่สามารถทำรายการได้");
    }
  };

  if (loading && !game) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active title paragraph={{ rows: 12 }} />
      </div>
    );
  }

  return (
    <Layout style={{ background: "#0f1419", minHeight: "100vh" }}>
      {ctx}

      <Header
        style={{
          background: "#0f1419",
          padding: 0,
          height: 360,
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid #1f2933",
        }}
      >
        {/* BG blur */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: cover ? `url(${cover})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(16px)",
            transform: "scale(1.25)",
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
            gridTemplateColumns: "minmax(280px, 360px) 1fr 380px",
            gap: 20,
            alignItems: "center",
            padding: "24px 28px",
          }}
        >
          {/* Cover */}
          <div
            style={{
              width: "100%",
              height: 260,
              borderRadius: 12,
              overflow: "hidden",
              background: "#1f2933",
              border: "1px solid #2b3a42",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            }}
          >
            {cover ? (
              <img
                src={cover}
                alt={title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  color: "#8899a6",
                  fontSize: 32,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PictureOutlined /> &nbsp; No cover
              </div>
            )}
          </div>

          {/* Title / Tags / Desc / CTAs */}
          <div>
            <Title level={2} style={{ color: "#fff", margin: 0 }}>
              {title}
            </Title>
            <div style={{ margin: "8px 0 12px" }}>
              <Space size={[6, 6]} wrap>
                {tags.slice(0, 6).map((t) => (
                  <Tag key={t} color="blue">
                    {t}
                  </Tag>
                ))}
                {tags.length === 0 && <Tag>Action</Tag>}
              </Space>
            </div>
            <Paragraph style={{ color: "#d1d5db", maxWidth: 800, marginBottom: 12 }}>
              {String(desc).slice(0, 280)}
              {String(desc).length > 280 ? "…" : ""}
            </Paragraph>

            <Space size="middle" wrap>
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={handlePurchase} // ← ใช้งานปุ่ม Purchase
              >
                Add to Cart
              </Button>
            </Space>
          </div>

          {/* Price Card */}
          <Card size="small" bordered style={{ background: "#12181f", borderColor: "#2a3b45" }} bodyStyle={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "#b3c1cd", fontSize: 12 }}>CURRENT PRICE</div>
                <div style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>
                  {finalPrice.toLocaleString()} ฿
                </div>
                {discountPercent > 0 && (
                  <div style={{ color: "#9aa4ad", textDecoration: "line-through" }}>
                    {basePrice.toLocaleString()} ฿
                  </div>
                )}
              </div>
              {discountPercent > 0 && (
                <div
                  style={{
                    background: "#1f6f3c",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: 8,
                    padding: "6px 10px",
                    minWidth: 64,
                    textAlign: "center",
                  }}
                >
                  -{discountPercent}%
                </div>
              )}
            </div>
            <Divider style={{ borderColor: "#23313a" }} />
            <Button type="primary" icon={<ShoppingCartOutlined />} block 
            onClick={handlePurchase}>
              Purchase
            </Button>
          </Card>
        </div>
      </Header>

      {/* ===== Content ===== */}
      <Layout>
        <Content style={{ padding: 24 }}>
          {/* Screenshots */}
          <Card
            title="Screenshots"
            style={{ marginBottom: 16, background: "#12181f", borderColor: "#23313a" }}
            headStyle={{ color: "#fff" }}
            bodyStyle={{ padding: 0 }}
          >
            {screenshots.length > 0 ? (
              <Carousel autoplay draggable>
                {screenshots.map((src, i) => (
                  <div key={i} style={{ height: 380, overflow: "hidden" }}>
                    <img src={src} alt={`shot-${i}`} style={{ width: "100%", height: 380, objectFit: "cover" }} />
                  </div>
                ))}
              </Carousel>
            ) : (
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7a8a99",
                }}
              >
                <PictureOutlined style={{ fontSize: 28 }} /> &nbsp; No screenshots
              </div>
            )}
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Card title="About this game" style={{ background: "#12181f", borderColor: "#23313a" }} headStyle={{ color: "#fff" }}>
                <Paragraph style={{ color: "#c7d0d9", whiteSpace: "pre-wrap" }}>{desc}</Paragraph>
                <Divider />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <Text style={{ color: "#98a6b3" }}>Developer</Text>
                    <div style={{ color: "#e5eef5" }}>{(game as any)?.developer ?? "Unknown"}</div>
                  </div>
                  <div>
                    <Text style={{ color: "#98a6b3" }}>Publisher</Text>
                    <div style={{ color: "#e5eef5" }}>{(game as any)?.publisher ?? "Unknown"}</div>
                  </div>
                  <div>
                    <Text style={{ color: "#98a6b3" }}>Release date</Text>
                    <div style={{ color: "#e5eef5" }}>{(game as any)?.release_date ?? "N/A"}</div>
                  </div>
                  <div>
                    <Text style={{ color: "#98a6b3" }}>Genres</Text>
                    <div>
                      <Space size={[6, 6]} wrap>
                        {tags.map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                        {tags.length === 0 && <Tag>Action</Tag>}
                      </Space>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                title="System Requirements (Minimum)"
                style={{ background: "#12181f", borderColor: "#23313a" }}
                headStyle={{ color: "#fff" }}
              >
                <div style={{ color: "#c7d0d9" }}>
                  <p><b>OS:</b> {os}</p>
                  <p><b>Processor:</b> {cpu}</p>
                  <p><b>Memory:</b> {ram}</p>
                  <p><b>Graphics:</b> {gpu}</p>
                  <p><b>Storage:</b> {storage}</p>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Workshop items */}
          <Card
            title={<Space><ToolOutlined /> <span>Workshop Items</span></Space>}
            extra={<Button onClick={() => navigate(`/workshop/${gid}`)}>Browse all</Button>}
            style={{ marginTop: 16, background: "#12181f", borderColor: "#23313a" }}
            headStyle={{ color: "#fff" }}
          >
            <Row gutter={[16, 16]}>
              {topMods.map((m) => {
                const img = (m as any)?.image_path ?? (m as any)?.img_src ?? "";
                const cover = resolveImgUrl(img);
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={(m as any)?.ID ?? (m as any)?.id}>
                    <Card
                      hoverable
                      style={{ background: "#1a1a1a", borderColor: "#262626" }}
                      cover={
                        cover ? (
                          <img src={cover} alt={(m as any)?.title} style={{ height: 160, objectFit: "cover" }} />
                        ) : (
                          <div
                            style={{
                              height: 160,
                              background: "linear-gradient(135deg,#2b2b2b 0%,#1f1f1f 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#888",
                              fontSize: 30,
                            }}
                          >
                            <PictureOutlined />
                          </div>
                        )
                      }
                      onClick={() => navigate(`/mod/${(m as any)?.ID ?? (m as any)?.id}`)}
                    >
                      <Text style={{ color: "#fff", fontWeight: 600 }}>
                        {(m as any)?.title ?? "Untitled Mod"}
                      </Text>
                      <div style={{ color: "#9aa4ad", fontSize: 12, marginTop: 4 }}>
                        <StarFilled style={{ color: "#f5c518" }} />{" "}
                        {Number((m as any)?.rating ?? (m as any)?.avg_rating ?? 0).toFixed(1)} / 5
                      </div>
                    </Card>
                  </Col>
                );
              })}
              {topMods.length === 0 && (
                <Col span={24} style={{ textAlign: "center", color: "#9aa4ad" }}>
                  No workshop items for this game yet.
                </Col>
              )}
            </Row>
          </Card>
        </Content>

        {/* Side info */}
        <Sider width={320} style={{ background: "#0f1419", padding: "24px 16px" }}>
          <Card
            size="small"
            title={<Space><TagsOutlined /> <span>Tags</span></Space>}
            style={{ background: "#12181f", borderColor: "#23313a", marginBottom: 16 }}
            headStyle={{ color: "#fff" }}
          >
            <Space size={[6, 6]} wrap>
              {tags.slice(0, 12).map((t) => (
                <Tag key={t} color="geekblue">
                  {t}
                </Tag>
              ))}
              {tags.length === 0 && <Tag>Singleplayer</Tag>}
            </Space>
          </Card>

          <Card size="small" title="User Reviews" style={{ background: "#12181f", borderColor: "#23313a" }} headStyle={{ color: "#fff" }}>
            <div style={{ color: "#d1d5db" }}>
              Overall: <b>{(game as any)?.review_summary ?? "—"}</b>
              <br />
              Recent: <b>{(game as any)?.recent_review_summary ?? "—"}</b>
              <br />
              Total reviews: <b>{safeNum((game as any)?.review_count, 0).toLocaleString()}</b>
            </div>
          </Card>
        </Sider>
      </Layout>
    </Layout>
  );
};

export default GameDetail;
