import { Card, Button } from "antd";
import type { Game } from "../interfaces/Game";

interface GameCardProps {
  game: Game;
  imgSrc: string;
  onBuy: () => void;
}

export default function GameCard({ game, imgSrc, onBuy }: GameCardProps) {
  const hasDiscount = game.discounted_price < game.base_price;

  return (
    <Card
      style={{ background: "#1f1f1f", color: "white", borderRadius: 10 }}
      cover={
        <img
          src={imgSrc}
          alt={game.game_name}
          style={{ height: 150, objectFit: "cover" }}
        />
      }
    >
      <Card.Meta
        title={<div style={{ color: "#fff" }}>{game.game_name}</div>}
      />
      <div style={{ marginTop: 10, color: "#9254de" }}>
        {hasDiscount ? (
          <>
            <span style={{ textDecoration: "line-through", color: "#ccc" }}>
              {game.base_price}
            </span>
            <span style={{ marginLeft: 8 }}>{game.discounted_price}</span>
          </>
        ) : (
          game.base_price
        )}
      </div>
      <Button block style={{ marginTop: 10 }} onClick={onBuy}>
        ไปหน้าซื้อ
      </Button>
    </Card>
  );
}

