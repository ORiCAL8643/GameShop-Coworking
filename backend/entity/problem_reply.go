package entity

import "gorm.io/gorm"

// ProblemReply represents an administrator reply to a problem report.
type ProblemReply struct {
	gorm.Model
	ReportID uint   `json:"report_id"`
	AdminID  uint   `json:"admin_id"`
	Message  string `json:"message"`

	Attachments []ProblemReplyAttachment `json:"attachments" gorm:"foreignKey:ReplyID"`
}
