package entity

import (
	"time"

	"gorm.io/gorm"
)

type Request struct {
	gorm.Model
	Reason    string    `json:"reason"`
	Date      time.Time `json:"release_date" gorm:"autoCreateTime"`
	UserRefer uint      `json:"user" gorm:"not null;index:idx_user_game,unique"`
	GameRefer uint      `json:"game" gorm:"not null;index:idx_user_game,unique"`
}
