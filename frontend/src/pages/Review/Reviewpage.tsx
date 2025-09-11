import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Rate } from "antd";
import ReviewSection from "../../components/ReviewSection";
import { ReviewsAPI } from "../../services/reviews";

type RawGame = {
  ID?: number;
  id?: number;
  game_name?: string;
  name?: string;
  img_src?: string;
  cover_url?: string;
};

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8088";

function normalizeGame(g: RawGame) {
  const id = g.ID ?? g.id ?? 0;
  const name = g.game_name ?? g.name ?? "Unknown Game";
  const img = g.img_src ?? g.cover_url ?? "";
  return { id: Number(id), name: String(name), img: img ? String(img) : "" };
}

function resolveImgUrl(img?: string) {
  if (!img) return undefined;
  const s = img.replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:")) return s;
  if (s.startsWith("/uploads")) return `${BASE}${s}`;
  if (s.startsWith("uploads")) return `${BASE}/${s}`;
  return `${BASE}/${s.replace(/^\/+/, "")}`;
}

const Reviewpage: React.FC = () => {
  const { gameId } = useParams();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<{ id: number; name: string; img?: string } | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function fetchGame() {
      try {
        setLoading(true);
        const { data } = await axios.get(`${BASE}/games/${gameId}`);
        const ng = normalizeGame(data);
        if (!ignore) {
          setGame(ng);
          document.title = `${ng.name} • Reviews`;
        }
      } catch {
        setGame(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (gameId) fetchGame();
    return () => { ignore = true; };
  }, [gameId]);

  const cover = useMemo(() => resolveImgUrl(game?.img), [game]);

  useEffect(() => {
    async function fetchReviews() {
      if (!gameId) return;
      try {
        const list = await ReviewsAPI.listByGame(Number(gameId));
        if (list.length > 0) {
          const avg = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
          setAvgRating(avg);
          setReviewCount(list.length);
        } else {
          setAvgRating(null);
          setReviewCount(0);
        }
      } catch {
        setAvgRating(null);
        setReviewCount(0);
      }
    }
    fetchReviews();
  }, [gameId]);

  // ✅ ลดระยะให้พอดี: padding ซ้าย–ขวา 24px (ไม่มี margin-left 220 อีกแล้ว)
  const shellStyle: React.CSSProperties = {
    padding: "16px 24px 24px 24px",
  };

  if (loading) return <div style={shellStyle}>Loading…</div>;
  if (!game)  return <div style={shellStyle}>ไม่พบข้อมูลเกม</div>;

  return (
    <div style={shellStyle}>
      {/* hero กว้างพอดี และไม่ชิดซ้ายเกินไป */}
      <div className="rounded-2xl overflow-hidden bg-[#1a1a1a] shadow mb-6 max-w-5xl mx-auto">
        {cover && (
          <img
            src={cover}
            alt={game.name}
            style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }}
          />
        )}
        <div className="p-4">
          <h1 className="text-xl md:text-2xl font-semibold flex items-center">
            {game.name}
            {reviewCount > 0 ? (
              <span className="ml-2 inline-flex items-center">
                <Rate disabled allowHalf value={avgRating ?? 0} />
                <span className="ml-1 text-sm text-gray-400">{avgRating?.toFixed(1)}</span>
              </span>
            ) : (
              <span className="ml-2 text-sm text-gray-400">–</span>
            )}
          </h1>
          <p className="text-gray-400">All reviews for this game</p>
        </div>
      </div>

      {/* ส่วนรีวิว – จำกัดความกว้างให้อ่านสบาย */}
      <div className="max-w-5xl mx-auto">
        <ReviewSection gameId={game.id} allowCreate className="mt-4" />
      </div>
    </div>
  );
};

export default Reviewpage;
