package entity

import "gorm.io/gorm"
import "time"


type Thread struct {
	gorm.Model
	Title        string        `json:"title"`
	Content      string        `json:"content" gorm:"type:text"`
	GameID       uint          `json:"game_id" gorm:"not null"`
	Game         Game          `json:"game"`
	UserID       uint          `json:"user_id" gorm:"not null"`
	User         User          `json:"user"`
	PostedAt     time.Time     `json:"posted_at"`
	LikeCount    int64         `json:"like_count" gorm:"default:0"`
	CommentCount int64         `json:"comment_count" gorm:"default:0"`
	ThreadImages []ThreadImage `json:"images"`
}
