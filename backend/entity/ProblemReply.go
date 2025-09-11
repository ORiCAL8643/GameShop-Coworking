package entity

import "gorm.io/gorm"

// Reply จากแอดมิน
type ProblemReply struct {
	gorm.Model
	ReportID uint   `json:"report_id"`
	AdminID  uint   `json:"admin_id"`
	Message  string `json:"message"`

	// Relations
	Report      ProblemReport            `json:"report"`
	Attachments []ProblemReplyAttachment `json:"attachments" gorm:"foreignKey:ReplyID;references:ID"`
}

// ไฟล์แนบของ Reply (แอดมินแนบ)
type ProblemReplyAttachment struct {
	gorm.Model
	ReplyID  uint   `json:"reply_id"`
	FilePath string `json:"file_path"`

	// Relation ย้อนกลับ (ช่วยให้ GORM map FK ชัดเจน)
	Reply ProblemReply `json:"-" gorm:"foreignKey:ReplyID;references:ID"`
}
