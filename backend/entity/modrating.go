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

	UserGameID uint      `json:"user_game_id"`
	UserGame   *UserGame `gorm:"foreignKey:UserGameID" json:"user_game"`

	ModID uint `json:"mod_id"`
	Mod   *Mod `gorm:"foreignKey:ModID" json:"mod"`
}
