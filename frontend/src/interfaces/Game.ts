// src/interfaces/Game.ts
export interface Game {
  ID: number;
  game_name: string;
  key_id: number;
  categories: { ID: number; title: string };
  release_date: string;
  base_price: number;
  discounted_price?: number;
  img_src: string;
  age_rating: number;
  status: string;
  minimum_spec_id: number;
}

export interface CreateGameRequest {
  game_name: string;
  game_price: number;
  description: string;
}

export interface UpdateGameRequest {
  ID: number;
  game_name?: string;
  game_price?: number;
  description?: string;
}

