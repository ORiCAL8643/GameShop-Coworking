// src/interfaces/Promotion.ts
import type { Game } from "./Game";
import type { User } from "./User";

export type DiscountType = "PERCENT" | "AMOUNT";

export interface Promotion {
  ID: number;
  discount_type: DiscountType;
  discount_value: number;        // >= 0
  start_date: string;            // ISO string
  end_date: string;              // ISO string
  promo_image?: string;
  status: boolean;
  user_id?: number;
  user?: User;
  games?: Game[];
}

export interface CreatePromotionRequest {
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;   // e.g., new Date().toISOString()
  end_date: string;
  promo_image?: string;
  status?: boolean;
  user_id?: number;
  game_ids?: number[];
}

export interface UpdatePromotionRequest extends Partial<CreatePromotionRequest> {}
