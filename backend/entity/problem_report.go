package entity

import (
	"time"

	"gorm.io/gorm"
)

type ProblemReport struct {
	gorm.Model
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Category    string     `json:"category"`
	Status      string     `json:"status"`
	UserID      uint       `json:"user_id"`
	ResolvedAt  *time.Time `json:"resolved_at"`

	// Relations
	User        User                `json:"user"`
	Attachments []ProblemAttachment `json:"attachments" gorm:"foreignKey:ReportID"`
	Replies     []ProblemReply      `json:"replies" gorm:"foreignKey:ReportID"`
}
