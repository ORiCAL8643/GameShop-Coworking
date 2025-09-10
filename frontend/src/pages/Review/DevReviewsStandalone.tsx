// frontend/src/pages/Review/DevReviewsStandalone.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ReviewSection from "../../components/ReviewSection";

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

const DevReviewsStandalone: React.FC = () => {
  const { gameId } = useParams();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<{ id: number; name: string; img?: string } | null>(null);

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
      } catch (e) {
        console.error(e);
        setGame(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (gameId) fetchGame();
    return () => {
      ignore = true;
    };
  }, [gameId]);

  const cover = useMemo(() => resolveImgUrl(game?.img), [game]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!game) {
    return <div className="p-6">ไม่พบข้อมูลเกม</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ส่วนบน: รูปเกม + ชื่อเกม */}
      <div className="rounded-2xl overflow-hidden shadow-lg mb-6">
        {cover && (
          <img
            src={cover}
            alt={game.name}
            style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }}
          />
        )}
        <div className="p-4 text-center">
          <h1 className="text-2xl font-semibold">{game.name}</h1>
          <p className="text-gray-500">All reviews for this game</p>
        </div>
      </div>

      {/* ส่วนล่าง: ReviewSection ของเกมนี้ */}
      <ReviewSection gameId={game.id} allowCreate />
    </div>
  );
};

export default DevReviewsStandalone;
