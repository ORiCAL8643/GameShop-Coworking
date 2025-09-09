export interface Mod {
  ID: number;
  title: string;
  description: string;
  upload_date: string;
  file_path: string;
  status: string;
  user_game_id: number;
  game_id: number;
}

export interface CreateModRequest {
  title: string;
  description: string;
  upload_date: string;
  file_path: string;
  status: string;
  user_game_id: number;
  game_id: number;
}
