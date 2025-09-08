// src/interfaces/Review.ts
import type { User } from "./User";
import type { Game } from "./Game";

export interface Review {
  ID: number;
  review_title: string;
  review_text?: string;
  rating: number;        // 0-10
  user_id: number;
  user?: User;
  game_id: number;
  game?: Game;
  likes?: ReviewLike[];
}

export interface ReviewLike {
  ID: number;
  review_id: number;
  user_id: number;
  game_id?: number;
}

export interface CreateReviewRequest {
  review_title: string;
  review_text?: string;
  rating: number;        // 0-10
  user_id: number;
  game_id: number;
}

export interface UpdateReviewRequest extends Partial<CreateReviewRequest> {}

export interface ToggleLikeRequest { user_id: number; }
