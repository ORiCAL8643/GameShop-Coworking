export interface ModRating {
  id: number;
  rating: string;        // หรือ number ตามจริง
  comment: string;       // ✅ เปลี่ยนมาใช้ comment
  purchase_date: string; // ISO string
  user_game_id: number;
  mod_id: number;
  // ...
}

/*export interface ModRating {
  ID: number;
  rating: number;
  user_id: number;
  mod_id: number;
}*/

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
