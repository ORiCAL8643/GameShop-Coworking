package entity

import (
	"time"

	"gorm.io/gorm"
)

type OwnerGame struct {
	gorm.Model

	PurchaseDate time.Time `json:"purchase_date"`
	Status       string    `json:"status"`

	UserGameID uint      `json:"user_game_id"`
	UserGame   *UserGame `gorm:"foreignKey:UserGameID" json:"user_game"`

	GameID uint  `json:"game_id"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game"`
}
