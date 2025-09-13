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
  List,
} from "antd";
import {
  DownloadOutlined,
  EditOutlined,
  PictureOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { getMod, getGame, listUserGames } from "../../services/workshop"; // ⬅️ เพิ่ม listUserGames
import type { Game } from "../../interfaces";
import { useAuth } from "../../context/AuthContext";

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ?? "http://localhost:8088";

// ------ URL helpers ------
const normalizePath = (s?: string) => (s ? s.replace(/\\/g, "/") : "");
const resolveUrl = (src?: string) => {
  const s = normalizePath(src);
  if (!s) return "";
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:")
  )
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
      "",
  );

const getModFileUrl = (m: any) =>
  resolveUrl(
    m?.file_path ?? m?.FilePath ?? m?.fileUrl ?? m?.FileURL ?? m?.file ?? "",
  );

const getGameBannerUrl = (g: any) =>
  resolveUrl(g?.img_src ?? g?.image_path ?? g?.ImagePath ?? g?.cover ?? "");

const toDateText = (d?: string) => {
  if (!d) return "-";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleString();
};

// ให้ timestamp เสมอ: ถ้าวันที่พัง → -Infinity
const ts = (s?: string) => {
  const t = Date.parse(s ?? "");
  return Number.isFinite(t) ? t : -Infinity;
};

// ------ types ------
type ModRating = {
  id?: number;
  user_id?: number | string;
  mod_id?: number | string;
  score: number; // 0..5
  comment?: string;
  created_at?: string;
  user?: { username?: string; name?: string };
};

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const ModDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { id: authUserId } = useAuth() as { id?: number | string };

  const [mod, setMod] = useState<any>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);

  // สิทธิ์แก้ไข
  const [canEdit, setCanEdit] = useState(false);

  // ratings
  const [ratings, setRatings] = useState<ModRating[]>([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [myScore, setMyScore] = useState<number | undefined>(undefined);
  const [myRating, setMyRating] = useState<ModRating | undefined>(undefined);
  const [submittingRating, setSubmittingRating] = useState(false);

  // comments
  const [comments, setComments] = useState<ModRating[]>([]);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

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

  // -------- ตรวจว่าเป็น 'เจ้าของม็อด' หรือไม่ --------
  useEffect(() => {
    const myId = num(authUserId);
    if (!myId || !mod) {
      setCanEdit(false);
      return;
    }

    // 1) ถ้ามี user_id ในม็อด เทียบตรง ๆ เลย
    const ownerUserId = num(mod?.user_id ?? mod?.UserID ?? mod?.userId);
    if (ownerUserId != null) {
      setCanEdit(ownerUserId === myId);
      return;
    }

    // 2) ถ้ามี user_game_id → ไปดึง user-games ของผู้ใช้ แล้วเช็คว่า id ตรงกันไหม
    const ownerUserGameId = num(
      mod?.user_game_id ?? mod?.userGameId ?? mod?.UserGameID,
    );
    if (ownerUserGameId == null) {
      setCanEdit(false);
      return;
    }

    listUserGames(myId)
      .then((rows: any[]) => {
        const match = (rows ?? []).some((r: any) => {
          const ugid =
            num(r?.user_game_id ?? r?.UserGameID) ?? num(r?.id ?? r?.ID); // รองรับทั้ง 2 key
          return ugid === ownerUserGameId;
        });
        setCanEdit(match);
      })
      .catch(() => setCanEdit(false));
  }, [authUserId, mod]);

  // -------- ratings --------
  const modIdNum = useMemo(() => Number(id), [id]);

  const recalc = (list: ModRating[]) => {
    const valid = list.filter((r) => Number(r.score) > 0);
    const n = valid.length;
    const sum = valid.reduce((acc, r) => acc + Number(r.score || 0), 0);
    setCount(n);
    setAvg(n ? sum / n : 0);
    const myId = authUserId != null ? Number(authUserId) : undefined;
    const mine = myId ? list.find((r) => Number(r.user_id) === myId) : undefined;
    setMyRating(mine);
    setMyScore(mine && Number(mine.score) > 0 ? Number(mine.score) : undefined);
  };

  const fetchRatings = async () => {
    if (!modIdNum) return;
    try {
      const res = await fetch(`${API_BASE}/modratings?mod_id=${modIdNum}`);
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : data?.data ?? [];
      const list: ModRating[] = raw.map((r) => ({
        ...r,
        id: r.id ?? r.ID,
        score: Number(r.score ?? r.Score ?? 0),
        user_id: r.user_id ?? r.UserID,
        mod_id: r.mod_id ?? r.ModID,
        comment: r.comment ?? r.Comment,
        created_at: r.created_at ?? r.CreatedAt,
        user: r.user ?? r.User,
      }));
      setRatings(list);
      const comm = list
        .filter((r) => r.comment && r.comment.trim() !== "")
        .sort((a, b) => ts(b.created_at) - ts(a.created_at));
      setComments(comm);
      recalc(list);
    } catch (e) {
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
      setSubmittingRating(true);
      let res: Response;
      if (myRating?.id) {
        res = await fetch(`${API_BASE}/modratings/${myRating.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: value }),
        });
      } else {
        res = await fetch(`${API_BASE}/modratings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mod_id: modIdNum,
            user_id: Number(authUserId),
            score: value,
          }),
        });
      }
      if (!res.ok) throw new Error(await res.text());
      message.success("ขอบคุณสำหรับการให้คะแนน!");
      await fetchRatings();
    } catch (e: any) {
      message.error(e?.message || "ให้คะแนนไม่สำเร็จ");
    } finally {
      setSubmittingRating(false);
    }
  };

  // -------- comments --------
  // comments are part of ratings; no separate fetch

  const submitComment = async () => {
    const content = comment.trim();
    if (!authUserId) {
      message.error("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
      return;
    }
    if (!content) {
      message.warning("พิมพ์ข้อความก่อนโพสต์");
      return;
    }
    try {
      setSubmittingComment(true);
      let res: Response;
      if (myRating?.id) {
        res = await fetch(`${API_BASE}/modratings/${myRating.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: content }),
        });
      } else {
        res = await fetch(`${API_BASE}/modratings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mod_id: modIdNum,
            user_id: Number(authUserId),
            score: 0,
            comment: content,
          }),
        });
      }
      if (!res.ok) throw new Error(await res.text());
      setComment("");
      message.success("เพิ่มคอมเมนต์เรียบร้อย");
      await fetchRatings();
    } catch (e: any) {
      message.error(e?.message || "โพสต์คอมเมนต์ไม่สำเร็จ");
    } finally {
      setSubmittingComment(false);
    }
  };

  // -------- cover / banner --------
  const coverUrl = useMemo(() => {
    const mImg = getModImageUrl(mod || {});
    return mImg || getGameBannerUrl(game || {});
  }, [mod, game]);

  const downloadUrl = useMemo(() => {
    const mid = mod?.id ?? mod?.ID;
    return mid ? `${API_BASE}/mods/${mid}/download` : "";
  }, [mod]);

  const uploadedText = useMemo(() => {
    const t =
      mod?.upload_date ??
      mod?.UploadDate ??
      mod?.created_at ??
      mod?.CreatedAt ??
      "";
    return toDateText(t);
  }, [mod]);

  return (
    <Layout style={{ background: "#0f1419", minHeight: "100vh" }}>
      {/* ===== Hero Banner ===== */}
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
        <Content style={{ padding: 20, background: "#0f1419" }}>
          <Row gutter={[16, 16]}>
            {/* ซ้าย */}
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

                  {/* ✅ ปุ่ม Edit เฉพาะเจ้าของม็อดเท่านั้น */}
                  {canEdit && (
                    <Link to={`/workshop/upload?modId=${mod?.ID ?? mod?.id}`}>
                      <Button icon={<EditOutlined />}>Edit</Button>
                    </Link>
                  )}
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
                    <Divider
                      style={{ borderColor: "#2b3a42", margin: "12px 0" }}
                    />
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
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </>
                )}
              </Card>

              {/* ====== Rate this Mod ====== */}
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
                    disabled={submittingRating}
                    allowHalf={false}
                    count={5}
                  />
                  <Text style={{ color: "#c9d1d9" }}>
                    {myScore ? `Your rating: ${myScore}/5` : "No rating yet"}
                  </Text>
                </div>
                <Divider style={{ borderColor: "#2b3a42" }} />
                <Text style={{ color: "#9aa4ad" }}>
                  <b>Average Rating:</b>{" "}
                  <span style={{ color: "#fff" }}>{avg.toFixed(1)} / 5</span> (
                  {count} {count === 1 ? "rating" : "ratings"})
                </Text>
              </Card>

              {/* ====== Comments ====== */}
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
                  style={{
                    background: "#1a1a1a",
                    color: "#fff",
                    borderColor: "#2b3a42",
                  }}
                />
                <div style={{ textAlign: "right", marginTop: 10 }}>
                  <Button
                    type="primary"
                    onClick={submitComment}
                    loading={submittingComment}
                  >
                    Add Comment
                  </Button>
                </div>

                <Divider style={{ borderColor: "#2b3a42" }} />

                <List
                  dataSource={comments}
                  locale={{ emptyText: "ยังไม่มีคอมเมนต์" }}
                  renderItem={(c) => (
                    <List.Item style={{ borderColor: "#1f2933" }}>
                      <List.Item.Meta
                        title={
                          <span style={{ color: "#fff" }}>
                            {c.user?.username ||
                              c.user?.name ||
                              `User #${c.user_id}`}
                            <span
                              style={{
                                color: "#9aa4ad",
                                marginLeft: 8,
                                fontSize: 12,
                              }}
                            >
                              {toDateText(c.created_at)}
                            </span>
                          </span>
                        }
                        description={
                          <span
                            style={{ color: "#c9d1d9", whiteSpace: "pre-wrap" }}
                          >
                            {c.comment}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* ขวา */}
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
                    <div style={{ marginBottom: 6 }}>
                      📅 Uploaded: {uploadedText}
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      🧩 Game ID: {mod?.game_id ?? mod?.GameID ?? "-"}
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      👁 Views: {mod?.view_count ?? mod?.ViewCount ?? 0}
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      ⬇ Downloads:{" "}
                      {mod?.download_count ?? mod?.DownloadCount ?? 0}
                    </div>
                  </div>

                  <Divider style={{ borderColor: "rgba(255,255,255,0.25)" }} />

                  <div style={{ opacity: 0.95, marginBottom: 4 }}>
                    <Text style={{ color: "#fff" }}>{count} Ratings</Text>
                  </div>
                  <div
                    style={{ color: "rgba(255,255,255,0.9)", marginBottom: 8 }}
                  >
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
