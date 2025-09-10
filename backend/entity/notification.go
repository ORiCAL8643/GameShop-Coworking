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

        IsRead bool `json:"is_read" gorm:"default:false"`
}
