import type { Order } from "./Order";
import type { KeyGame } from "./KeyGame";

export interface OrderItem {
  ID: number;
  unit_price: number;
  qty: number;
  line_discount: number;
  line_total: number;
  order_id: number;
  game_key_id?: number | null;
  key_game?: KeyGame;
}

export interface CreateOrderItemRequest {
  unit_price: number;
  qty: number;
  line_discount: number;
  line_total: number;
  order_id: number;
  game_key_id?: number | null;
}

export interface UpdateOrderItemRequest {
  ID: number;
  unit_price?: number;
  qty?: number;
  line_discount?: number;
  line_total?: number;
  order_id?: number;
  game_key_id?: number | null;
}
