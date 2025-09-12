import { Card } from "antd";
import type { Game } from "../interfaces/Game";

interface GameCardProps {
  game: Game;
  imgSrc: string;
  onClick?: () => void;
}

export default function GameCard({ game, imgSrc, onClick }: GameCardProps) {
  const hasDiscount = game.discounted_price < game.base_price;

  return (
    <Card
      hoverable
      style={{
        background: "#1f1f1f",
        color: "white",
        borderRadius: 10,
        cursor: "pointer",
      }}
      cover={
        <img
          src={imgSrc}
          alt={game.game_name}
          style={{ height: 150, objectFit: "cover" }}
        />
      }
      onClick={onClick}
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
    </Card>
  );
}

