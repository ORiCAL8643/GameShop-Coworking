package entity

import (
	"time"

	"gorm.io/gorm"
)

type ModRating struct {
	gorm.Model

	Rating       string    `json:"rating"`
	Review       string    `json:"review"`
	PurchaseDate time.Time `json:"purchase_date"`

	GameUserID uint      `json:"game_user_id"`
	GameUser   *GameUser `gorm:"foreignKey:GameUserID" json:"game_user"`

	ModID uint  `json:"mod_id"`
	Mod   *Mod  `gorm:"foreignKey:ModID" json:"mod"`
}
