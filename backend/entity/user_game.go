package entity

import (
	"time"

	"gorm.io/gorm"
)


type UserGame struct {
	gorm.Model
	Status    string     `json:"status"`      // e.g. "active", "revoked"
	GrantedAt time.Time  `json:"granted_at"`
	RevokedAt *time.Time `json:"revoked_at"`  // เป็น nil ได้ถ้ายังไม่ถูกยกเลิก
	GameID    uint       `json:"game_id"`
	Game      *Game      `gorm:"foreignKey:GameID" json:"game"`
	UserID    uint       `json:"user_id"`
	User      *User      `gorm:"foreignKey:UserID" json:"user"`
}