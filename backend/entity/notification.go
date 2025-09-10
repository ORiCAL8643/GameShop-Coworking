package entity

import (
	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	Title   string `json:"title"`              // หัวข้อแจ้งเตือน
	Type    string `json:"type"`               // เช่น "report", "refund", "system"
	Message string `json:"message"`            // ข้อความแจ้งเตือน
	UserID  uint   `json:"user_id"`            // ID ของผู้ใช้ที่ได้รับแจ้งเตือน
	User    *User  `gorm:"foreignKey:UserID" json:"user"`

	IsRead bool `json:"is_read" gorm:"default:false"` // สถานะการอ่าน
}
