// entity/user_game.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type UserGame struct {
	gorm.Model

	UserID uint  `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	GameID uint  `json:"game_id"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game,omitempty"`

	GrantedAt          time.Time `json:"granted_at"`
	GrantedByPaymentID uint      `json:"granted_by_payment_id"`
}
