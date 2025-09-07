package entity

import "gorm.io/gorm"
type ProblemReport struct {
	gorm.Model
	Title       string `json:"title"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	ResolvedAt  string `json:"resolved_at"`
	Status      string `json:"status"`

	UserID uint `json:"user_id"`
	GameID uint `json:"game_id"`

	Attachments []ProblemAttachment `gorm:"foreignKey:ReportID" json:"attachments"`
}