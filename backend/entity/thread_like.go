package entity

import "gorm.io/gorm"

// ไลก์เฉพาะเธรด; ป้องกันกดซ้ำด้วย unique(ThreadID, UserID)
type ThreadLike struct {
	gorm.Model
	ThreadID uint `json:"thread_id" gorm:"not null;uniqueIndex:uniq_thread_user"`
	UserID   uint `json:"user_id"   gorm:"not null;uniqueIndex:uniq_thread_user"`
}