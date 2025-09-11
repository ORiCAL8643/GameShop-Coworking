package entity

import (
	"time"

	"gorm.io/gorm"
)

type ProblemReport struct {
	gorm.Model
	Title       string
	Description string
	Status      string
	UserID      uint
	ResolvedAt  *time.Time

	// Relations
	User        User
	Attachments []ProblemAttachment `gorm:"foreignKey:ReportID"`
	Replies     []ProblemReply      `gorm:"foreignKey:ReportID"`
}

// ไฟล์แนบของ Report (ของผู้ใช้)
type ProblemAttachment struct {
	gorm.Model
	FilePath string
	ReportID uint
}
