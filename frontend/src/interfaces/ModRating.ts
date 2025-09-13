export interface ModRating {
  ID: number;
  score: number;
  user_id: number;
  mod_id: number;
  comment?: string;
}

export interface CreateModRatingRequest {
  score: number;
  user_id: number;
  mod_id: number;
  comment?: string;
}

export interface UpdateModRatingRequest {
  ID: number;
  score?: number;
  user_id?: number;
  mod_id?: number;
  comment?: string;
}
