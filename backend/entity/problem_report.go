package entity

import (
	"time"

	"gorm.io/gorm"
)

type ProblemReport struct {
	gorm.Model
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`       // e.g. "open", "resolved", "in_progress"
	ResolvedAt  time.Time `json:"resolved_at"`  // zero-time = ยังไม่ปิดงาน

	UserID uint `json:"user_id"`
	GameID uint `json:"game_id"`

	Attachments []ProblemAttachment `gorm:"foreignKey:ReportID" json:"attachments"`
}
