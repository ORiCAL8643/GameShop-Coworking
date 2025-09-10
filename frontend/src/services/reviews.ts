// =============================
// File: src/services/reviews.ts
// =============================
import axios from "axios";


const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8088";


export type Review = {
ID: number;
created_at?: string;
updated_at?: string;
review_title: string;
review_text?: string;
rating: number; // 0-10
user_id: number;
game_id: number;
likes?: number;
user?: { ID: number; username?: string };
};


export type CreateReviewReq = Pick<
Review,
"review_title" | "review_text" | "rating" | "user_id" | "game_id"
>;
export type UpdateReviewReq = Partial<CreateReviewReq>;


export const ReviewsAPI = {
async listByGame(gameId: number) {
const { data } = await axios.get(`${BASE}/games/${gameId}/reviews`);
return data as Review[];
},
async create(body: CreateReviewReq) {
const { data } = await axios.post(`${BASE}/reviews`, body);
return data as Review;
},
async update(id: number, body: UpdateReviewReq) {
const { data } = await axios.put(`${BASE}/reviews/${id}`, body);
return data as Review;
},
async remove(id: number) {
await axios.delete(`${BASE}/reviews/${id}`);
},
async toggleLike(id: number, user_id: number) {
const { data } = await axios.post(`${BASE}/reviews/${id}/toggle_like`, { user_id });
return data as { review_id: number; likes: number };
},
};