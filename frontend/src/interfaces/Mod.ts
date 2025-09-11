import type { Game } from "./Game";
import type { UserGame } from "./UserGame";

export interface Mod {
  ID: number;
  title: string;
  description: string;
  upload_date: string;
  file_path: string;
  status: string;
  user_game_id: number;
  user_game?: UserGame;
  game_id: number;
  game?: Game;
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

export interface UpdateModRequest {
  ID: number;
  title?: string;
  description?: string;
  upload_date?: string;
  file_path?: string;
  status?: string;
  user_game_id?: number;
  game_id?: number;
}
