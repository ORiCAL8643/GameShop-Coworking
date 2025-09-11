package entity

import (
	"time"
	"gorm.io/gorm"
)

type ProblemReport struct {
        gorm.Model
        Title       string `json:"title"`
        Description string `json:"description"`

	UserID uint  `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

        GameID uint  `json:"game_id"`
        Game   *Game `gorm:"foreignKey:GameID" json:"game"`

        Status     string    `json:"status" gorm:"default:open"`
        ResolvedAt time.Time `json:"resolved_at"` // ✅ เพิ่มฟิลด์นี้

        // ✅ ข้อความตอบกลับจากแอดมิน (ถ้ามี)
        Reply string `json:"reply"`

        Attachments []ProblemAttachment `json:"attachments" gorm:"foreignKey:ReportID"`
}
