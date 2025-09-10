export interface ModRating {
  ID: number;
  rating: number;
  user_id: number;
  mod_id: number;
}

export interface CreateModRatingRequest {
  rating: number;
  user_id: number;
  mod_id: number;
}

export interface UpdateModRatingRequest {
  ID: number;
  rating?: number;
  user_id?: number;
  mod_id?: number;
}
