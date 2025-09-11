package entity

import "gorm.io/gorm"

// คอมเมนต์แบบ flat (ไม่ซ้อน reply)
type Comment struct {
	gorm.Model

	Content string `json:"content" gorm:"type:text;not null"`

	ThreadID uint    `json:"thread_id" gorm:"index;not null"`
	Thread   *Thread `gorm:"foreignKey:ThreadID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"thread,omitempty"`

	UserID *uint `json:"user_id" gorm:"index"`
	User   *User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"user,omitempty"`
}
