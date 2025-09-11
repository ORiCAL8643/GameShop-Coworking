package entity

import "gorm.io/gorm"

// ไลก์เฉพาะเธรด; ป้องกันกดซ้ำด้วย unique(ThreadID, UserID)
type ThreadLike struct {
	gorm.Model

	ThreadID uint    `json:"thread_id" gorm:"not null;index;uniqueIndex:uniq_like_user_thread"`
	Thread   *Thread `gorm:"foreignKey:ThreadID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"thread,omitempty"`

	UserID uint  `json:"user_id" gorm:"not null;index;uniqueIndex:uniq_like_user_thread"`
	User   *User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
}
