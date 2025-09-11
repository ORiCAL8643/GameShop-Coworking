package entity

import "gorm.io/gorm"

// Reply จากแอดมิน
type ProblemReply struct {
	gorm.Model
	ReportID uint
	AdminID  uint
	Message  string

	// Relations
	Report      ProblemReport
	Attachments []ProblemReplyAttachment `gorm:"foreignKey:ReplyID;references:ID"`
}

// ไฟล์แนบของ Reply (แอดมินแนบ)
type ProblemReplyAttachment struct {
	gorm.Model
	ReplyID  uint
	FilePath string

	// Relation ย้อนกลับ (ช่วยให้ GORM map FK ชัดเจน)
	Reply ProblemReply `gorm:"foreignKey:ReplyID;references:ID"`
}
