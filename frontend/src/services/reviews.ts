import axios from "axios";

/** รูปแบบรีวิวที่ UI ใช้จริง */
export type ReviewItem = {
  ID: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;

  // ⚠️ Backend อาจส่งชื่อฟิลด์แบบ snake_case หรือ PascalCase เรา map เป็นชื่อที่ UI ใช้:
  title?: string;      // ← review_title / ReviewTitle
  content: string;     // ← review_text / ReviewText
  rating: number;      // ← Rating

  game_id: number;     // ← GameID
  user_id: number;     // ← UserID

  username?: string;
  likes?: number;
  likedByMe?: boolean;
};

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8088";

/** ปรับชื่อฟิลด์ที่ backend ส่ง ให้เป็นรูปแบบที่ UI ใช้ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeReview = (r: any): ReviewItem => ({
  ID: Number(r?.ID ?? r?.id),
  CreatedAt: r?.CreatedAt ?? r?.createdAt ?? r?.created_at ?? "",
  UpdatedAt: r?.UpdatedAt ?? r?.updatedAt ?? r?.updated_at ?? "",
  DeletedAt: r?.DeletedAt ?? r?.deletedAt ?? r?.deleted_at ?? null,

  // รองรับทั้ง review_title และ ReviewTitle
  title: r?.review_title ?? r?.ReviewTitle ?? r?.title ?? "",
  // รองรับทั้ง review_text และ ReviewText
  content: r?.review_text ?? r?.ReviewText ?? r?.content ?? "",
  rating: Number(r?.rating ?? r?.Rating ?? 0),

  game_id: Number(r?.game_id ?? r?.GameID ?? r?.gameId),
  user_id: Number(r?.user_id ?? r?.UserID ?? r?.userId),

  username: r?.username,
  likes: typeof r?.likes === "number" ? r.likes : 0,
  likedByMe: typeof r?.likedByMe === "boolean" ? r.likedByMe : false,
});

export const ReviewsAPI = {
  /** GET /games/:id/reviews */
  async listByGame(gameId: number, token?: string): Promise<ReviewItem[]> {
    const res = await axios.get(`${BASE}/games/${gameId}/reviews`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const arr = Array.isArray(res.data) ? res.data : [];
    return arr.map(normalizeReview);
  },

  /** POST /reviews */
  async createJson(
    payload: {
      game_id: number;
      user_id: number;
      review_title?: string;
      review_text: string;
      rating: number;
    },
    token?: string
  ): Promise<ReviewItem> {
    const res = await axios.post(`${BASE}/reviews`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return normalizeReview(res.data);
  },

  /** PUT /reviews/:id */
  async updateJson(
    id: number,
    payload: {
      game_id: number;
      user_id: number;
      review_title?: string;
      review_text: string;
      rating: number;
    },
    token?: string
  ): Promise<ReviewItem> {
    const res = await axios.put(`${BASE}/reviews/${id}`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return normalizeReview(res.data);
  },

  /** DELETE /reviews/:id */
  async remove(id: number, token?: string) {
    const res = await axios.delete(`${BASE}/reviews/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  },

  /** POST /reviews/:id/toggle_like  { user_id }  */
  async toggleLike(
    reviewId: number,
    userId: number,
    token?: string
  ): Promise<{ review_id: number; likes: number; liked: boolean }> {
    const res = await axios.post(
      `${BASE}/reviews/${reviewId}/toggle_like`,
      { user_id: userId },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    const data = res.data || {};
    return {
      review_id: Number(data.review_id ?? reviewId),
      likes: typeof data.likes === "number" ? data.likes : 0,
      liked: !!data.liked,
    };
  },
};
    