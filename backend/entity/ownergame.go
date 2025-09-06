package entity

import (
	"time"

	"gorm.io/gorm"
)

type OwnerGame struct {
	gorm.Model

	PurchaseDate time.Time `json:"purchase_date"`
	Status       string    `json:"status"`

	GameUserID uint       `json:"game_user_id"`
	GameUser   *GameUser  `gorm:"foreignKey:GameUserID" json:"game_user"`

	GameID uint  `json:"game_id"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game"`
}
