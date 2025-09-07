// src/interfaces/KeyGame.ts
import type { Game } from "./Game";
import type { OrderItem } from "./OrderItem";

export interface KeyGame {
  ID: number;
  key: string;
  game_id: number;
  game?: Game;
  order_item_id?: number | null;
  order_item?: OrderItem;
}

export interface CreateKeyGameRequest {
  key?: string;
  game_id: number;
}
