package entity

import (
	"time"

	"gorm.io/gorm"
)

type Request struct {
	gorm.Model
	Reason    string    `json:"reason"`
	Date      time.Time `json:"release_date" gorm:"autoCreateTime"`
	UserRefer uint      `json:"user" gorm:"not null;index:idx_user_game,unique,priority:1"`
	GameRefer uint      `json:"game" gorm:"not null;index:idx_user_game,unique,priority:2"`

	User User `json:"user_obj" gorm:"foreignKey:UserRefer;references:ID"` // BelongsTo
	Game Game `json:"game_obj" gorm:"foreignKey:GameRefer;references:ID"` // BelongsTo
}
