// src/pages/Workshop/ModDetail.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Layout,
  Typography,
  Card,
  Button,
  message,
  Row,
  Col,
  Divider,
  Rate,
  Input,
} from "antd";
import {
  DownloadOutlined,
  EditOutlined,
  PictureOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { getMod, getGame } from "../../services/workshop";
import type { Game } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ?? "http://localhost:8088";

// ------ URL helpers (แก้รูปไม่ขึ้น + รองรับ path แบบ Windows) ------
const normalizePath = (s?: string) => (s ? s.replace(/\\/g, "/") : "");
const resolveUrl = (src?: string) => {
  const s = normalizePath(src);
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:"))
    return s;
  const clean = s.startsWith("/") ? s.slice(1) : s;
  return `${API_BASE}/${clean}`;
};

const getModImageUrl = (m: any) =>
  resolveUrl(
    m?.image_path ??
      m?.ImagePath ??
      m?.imageUrl ??
      m?.ImageURL ??
      m?.img_src ??
      m?.img ??
      m?.image ??
      ""
  );

const getModFileUrl = (m: any) =>
  resolveUrl(m?.file_path ?? m?.FilePath ?? m?.fileUrl ?? m?.FileURL ?? m?.file ?? "");

const getGameBannerUrl = (g: any) =>
  resolveUrl(g?.img_src ?? g?.image_path ?? g?.ImagePath ?? g?.cover ?? "");

const toDateText = (d?: string) => {
  if (!d) return "-";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleString();
};

// ------ types ratings ------
type ModRating = {
  id?: number;
  user_id?: number | string;
  mod_id?: number | string;
  score: number; // 1..5
  created_at?: string;
};

const ModDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { id: authUserId } = useAuth() as { id?: number | string };

  const [mod, setMod] = useState<any>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);

  // ratings
  const [ratings, setRatings] = useState<ModRating[]>([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [myScore, setMyScore] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  // comments (placeholder ให้หน้าตาเหมือนเดิม)
  const [comment, setComment] = useState("");

  // -------- load mod + game --------
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getMod(Number(id))
      .then(async (m: any) => {
        setMod(m);
        const gid = m?.game_id ?? m?.GameID ?? m?.gameId;
        if (gid) {
          try {
            const g = await getGame(Number(gid));
            setGame(g);
          } catch {}
        }
      })
      .catch((e) => message.error(e?.message || "ไม่พบข้อมูลม็อด"))
      .finally(() => setLoading(false));
  }, [id]);

  // -------- ratings --------
  const modIdNum = useMemo(() => Number(id), [id]);

  const recalc = (list: ModRating[]) => {
    const n = list.length;
    const sum = list.reduce((acc, r) => acc + Number(r.score || 0), 0);
    setCount(n);
    setAvg(n ? sum / n : 0);
    const myId = authUserId != null ? Number(authUserId) : undefined;
    setMyScore(myId ? list.find((r) => Number(r.user_id) === myId)?.score : undefined);
  };

  const fetchRatings = async () => {
    if (!modIdNum) return;
    try {
      const res = await fetch(`${API_BASE}/modratings?mod_id=${modIdNum}`);
      const data = await res.json();
      const list: ModRating[] = Array.isArray(data) ? data : data?.data ?? [];
      setRatings(list);
      recalc(list);
    } catch (e) {
      // ไม่ต้องเด้ง error ใหญ่ ให้หน้าใช้งานต่อได้
      console.warn("load ratings failed:", e);
    }
  };

  useEffect(() => {
    fetchRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modIdNum, authUserId]);

  const submitRating = async (value: number) => {
    if (!authUserId) {
      message.error("กรุณาเข้าสู่ระบบก่อนให้คะแนน");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/modratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mod_id: modIdNum,
          user_id: Number(authUserId),
          score: value,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      message.success("ขอบคุณสำหรับการให้คะแนน!");
      await fetchRatings();
    } catch (e: any) {
      message.error(e?.message || "ให้คะแนนไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  // -------- cover / banner --------
  const coverUrl = useMemo(() => {
    const mImg = getModImageUrl(mod || {});
    return mImg || getGameBannerUrl(game || {});
  }, [mod, game]);

  const downloadUrl = useMemo(() => getModFileUrl(mod || {}), [mod]);

  const uploadedText = useMemo(() => {
    const t =
      mod?.upload_date ?? mod?.UploadDate ?? mod?.created_at ?? mod?.CreatedAt ?? "";
    return toDateText(t);
  }, [mod]);

  return (
    <Layout style={{ background: "#0f1419", minHeight: "100vh" }}>
      {/* ===== Hero Banner (พื้นหลังรูปม็อดแบบเบลอ) — อยู่ในพื้นที่ของหน้าเท่านั้น ไม่ล้นไป Sidebar ===== */}
      <Header
        style={{
          background: "#0f1419",
          padding: 0,
          height: 300,
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid #1f2933",
        }}
      >
        {/* เบลอเฉพาะใน Header */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
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

        {/* เนื้อหาใน header */}
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
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              style={{ marginBottom: 12 }}
            >
              Back
            </Button>

            <div
              style={{
                color: "#fff",
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1.15,
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
              }}
            >
              {mod?.title || "Untitled Mod"}
            </div>
            <div style={{ color: "#c9d1d9", marginTop: 6, fontSize: 14 }}>
              Game: {game?.game_name ?? "-"}
            </div>
          </div>

          {/* ปกรูปคมชัด */}
          <div
            style={{
              justifySelf: "end",
              width: "100%",
              maxWidth: 380,
              height: 210,
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
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={mod?.title}
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
                No image
              </div>
            )}
          </div>
        </div>
      </Header>

      <Layout>
        {/* ใส่พื้นหลังเข้มให้เนื้อหา เพื่อไม่ดูขาว และเข้าชุดกับ Workshop */}
        <Content style={{ padding: 20, background: "#0f1419" }}>
          <Row gutter={[16, 16]}>
            {/* ซ้าย: เนื้อหา + ให้คะแนน (สไตล์เดิม) */}
            <Col xs={24} lg={16}>
              <Card
                loading={loading}
                style={{
                  background: "#111315",
                  borderColor: "#1f2933",
                  color: "#e5e7eb",
                }}
                bodyStyle={{ padding: 18 }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  {downloadUrl && (
                    <a href={downloadUrl} target="_blank" rel="noreferrer">
                      <Button type="primary" icon={<DownloadOutlined />}>
                        Download
                      </Button>
                    </a>
                  )}
                  <Link to={`/workshop/upload?modId=${mod?.ID ?? mod?.id}`}>
                    <Button icon={<EditOutlined />}>Edit</Button>
                  </Link>
                </div>

                <Divider style={{ borderColor: "#2b3a42", margin: "12px 0" }} />

                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                  Description
                </Title>
                <Paragraph style={{ color: "#c9d1d9", whiteSpace: "pre-wrap" }}>
                  {mod?.description || "No description"}
                </Paragraph>

                {getModImageUrl(mod) && (
                  <>
                    <Divider style={{ borderColor: "#2b3a42", margin: "12px 0" }} />
                    <Title level={5} style={{ color: "#fff", marginTop: 0 }}>
                      Screenshot
                    </Title>
                    <div
                      style={{
                        width: "100%",
                        maxHeight: 420,
                        overflow: "hidden",
                        borderRadius: 10,
                        border: "1px solid #2b3a42",
                      }}
                    >
                      <img
                        src={getModImageUrl(mod)}
                        alt="mod"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </>
                )}
              </Card>

              {/* ====== Rate this Mod (เหมือนเดิม) ====== */}
              <Card
                style={{
                  background: "#111315",
                  borderColor: "#1f2933",
                  marginTop: 16,
                }}
                bodyStyle={{ padding: 18 }}
              >
                <Title level={4} style={{ color: "#fff", marginTop: 0 }}>
                  Rate this Mod
                </Title>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Rate
                    value={myScore}
                    onChange={submitRating}
                    disabled={submitting}
                  />
                  <Text style={{ color: "#c9d1d9" }}>
                    {myScore ? `Your rating: ${myScore}/5` : "No rating yet"}
                  </Text>
                </div>
                <Divider style={{ borderColor: "#2b3a42" }} />
                <Text style={{ color: "#9aa4ad" }}>
                  <b>Average Rating:</b>{" "}
                  <span style={{ color: "#fff" }}>{avg.toFixed(1)} / 5</span>{" "}
                  ({count} {count === 1 ? "rating" : "ratings"})
                </Text>
              </Card>

              {/* Comments (วางสไตล์เดิม) */}
              <Card
                style={{
                  background: "#111315",
                  borderColor: "#1f2933",
                  marginTop: 16,
                }}
                bodyStyle={{ padding: 18 }}
              >
                <Title level={4} style={{ color: "#fff", marginTop: 0 }}>
                  Comments
                </Title>
                <Input.TextArea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Write a comment..."
                  style={{ background: "#1a1a1a", color: "#fff", borderColor: "#2b3a42" }}
                />
                <div style={{ textAlign: "right", marginTop: 10 }}>
                  <Button type="primary" disabled>
                    Add Comment
                  </Button>
                </div>
              </Card>
            </Col>

            {/* ขวา: แผงข้อมูล (สรุปเรตติ้งแบบเดิม) */}
            <Col xs={24} lg={8}>
              <Sider
                width="100%"
                style={{
                  background:
                    "linear-gradient(180deg, #8A2BE2 0%, #6C5CE7 60%, #5B86E5 100%)",
                  padding: 16,
                  borderRadius: 12,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ color: "#fff" }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 6,
                      opacity: 0.95,
                    }}
                  >
                    👤 Mod ID: {mod?.ID ?? mod?.id ?? "-"}
                  </div>
                  <div style={{ opacity: 0.9 }}>
                    <div style={{ marginBottom: 6 }}>📅 Uploaded: {uploadedText}</div>
                    <div style={{ marginBottom: 6 }}>
                      🧩 Game ID: {mod?.game_id ?? mod?.GameID ?? "-"}
                    </div>
                  </div>

                  <Divider style={{ borderColor: "rgba(255,255,255,0.25)" }} />

                  <div style={{ opacity: 0.95, marginBottom: 4 }}>
                    <Text style={{ color: "#fff" }}>{count} Ratings</Text>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.9)", marginBottom: 8 }}>
                    Average: {avg.toFixed(1)} / 5
                  </div>
                </div>
              </Sider>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ModDetail;
