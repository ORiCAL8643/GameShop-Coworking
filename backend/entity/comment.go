package entity

import "gorm.io/gorm"

type Comment struct {
	gorm.Model
	Content  string `json:"content" gorm:"type:text;not null"`
	ThreadID uint   `json:"thread_id" gorm:"index;not null"`
	Thread   Thread `json:"-"`
	UserID   uint   `json:"user_id" gorm:"not null"`
	User     User   `json:"user"`
}
