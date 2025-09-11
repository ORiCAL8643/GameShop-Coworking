// entity/user_game.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type UserGame struct {
	gorm.Model

	UserID uint  `json:"user_id" gorm:"index:idx_user_game_unique,unique"`
	User   *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	GameID uint  `json:"game_id" gorm:"index:idx_user_game_unique,unique"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game,omitempty"`

	GrantedAt          time.Time `json:"granted_at"`
	GrantedByPaymentID uint      `json:"granted_by_payment_id"`
}
