package entity

import (
	"time"

	"gorm.io/gorm"
)

// ProblemReport represents a problem/bug report created by a user.
//
// Fields follow the requirements in the task description:
//   - category: text category chosen by user
//   - status:  "pending" or "resolved"
//   - attachments: files uploaded when creating the report
//   - replies: admin replies (with their own attachments)
type ProblemReport struct {
	gorm.Model
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`

	Status     string     `json:"status" gorm:"default:pending"`
	ResolvedAt *time.Time `json:"resolved_at"`

	UserID uint  `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	Attachments []ProblemAttachment `json:"attachments" gorm:"foreignKey:ReportID"`
	Replies     []ProblemReply      `json:"replies" gorm:"foreignKey:ReportID"`
}
