export interface ModRating {
  ID: number;
  rating: string;
  review: string;
  purchase_date: string;
  user_game_id: number;
  mod_id: number;
  CreatedAt?: string;
}

export interface CreateModRatingRequest {
  rating: string;
  review: string;
  user_game_id: number;
  mod_id: number;
}
