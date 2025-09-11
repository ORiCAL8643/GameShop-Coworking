package entity

import (
	"time"

	"gorm.io/gorm"
)

type Thread struct {
	gorm.Model

	Title   string `json:"title" gorm:"size:200;not null"`
	Content string `json:"content" gorm:"type:text;not null"`

	// ผูกกับเกม (ลบเกม -> ลบเธรด)
	GameID uint  `json:"game_id" gorm:"index;not null"`
	Game   *Game `gorm:"foreignKey:GameID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"game,omitempty"`

	// ผู้สร้าง (ลบผู้ใช้ -> เก็บโพสต์ไว้ ผู้สร้างเป็น NULL)
	UserID *uint `json:"user_id" gorm:"index"`
	User   *User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"user,omitempty"`

	CommentCount int64     `json:"comment_count" gorm:"default:0"`
	LikeCount    int64     `json:"like_count" gorm:"default:0"`
	PostedAt     time.Time `json:"posted_at"`

	ThreadImages []ThreadImage `gorm:"foreignKey:ThreadID" json:"images,omitempty"`
	Comments     []Comment     `gorm:"foreignKey:ThreadID" json:"comments,omitempty"`
}
