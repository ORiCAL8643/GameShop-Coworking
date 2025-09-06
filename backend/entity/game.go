package entity

import (
	"gorm.io/gorm"
)

type Game struct {
	gorm.Model
	GameName    string  `json:"game_name"`
	GamePrice   float64 `json:"game_price"` // ใช้ float64 ง่าย ๆ ถ้าอยากแม่นยำค่อยเปลี่ยนเป็น decimal lib
	Description string  `json:"description"`

	Threads   []Thread   `gorm:"foreignKey:GameID" json:"threads,omitempty"`
	UserGames []UserGame `gorm:"foreignKey:GameID" json:"user_games,omitempty"`

	Reviews     []Review      `gorm:"foreignKey:GameID" json:"reviews,omitempty"`
    ReviewLikes []Review_Like `gorm:"foreignKey:GameID" json:"review_likes,omitempty"`

	Promotions      []Promotion      `json:"promotions,omitempty"       gorm:"many2many:promotion_games"`
	PromotionGames  []Promotion_Game `json:"promotion_games,omitempty"  gorm:"foreignKey:GameID"`
}