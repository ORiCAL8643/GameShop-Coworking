package entity

import (
	"gorm.io/gorm"
)

type Notification struct {
        gorm.Model
        Title   string `json:"title"`
        Type    string `json:"type"`    // e.g. "payment", "system", ...
        Message string `json:"message"`
        UserID  uint   `json:"user_id"`
        User    *User  `gorm:"foreignKey:UserID" json:"user"`

        // ระบุว่าผู้ใช้ได้อ่านการแจ้งเตือนนี้แล้วหรือยัง
        IsRead bool `json:"is_read"`
}