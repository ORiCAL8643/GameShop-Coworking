package entity

import "gorm.io/gorm"

// คำตอบจากแอดมินในแต่ละ Report
type ProblemReply struct {
	gorm.Model

	// FK ไปยัง ProblemReport
	ReportID uint           `json:"report_id" gorm:"not null;index"`
	Report   *ProblemReport `json:"-" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	// ใครเป็นคนตอบ
	AdminID uint  `json:"admin_id" gorm:"not null;index"`
	Admin   *User `json:"admin" gorm:"foreignKey:AdminID"`

	// ข้อความตอบกลับ
	Message string `json:"message" gorm:"type:text;not null"`

	// ไฟล์แนบของการตอบกลับ
	Attachments []ProblemReplyAttachment `json:"attachments" gorm:"foreignKey:ReplyID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

// ไฟล์แนบของคำตอบแอดมิน
type ProblemReplyAttachment struct {
	gorm.Model

	// FK ไปยัง ProblemReply
	ReplyID uint          `json:"reply_id" gorm:"not null;index"`
	Reply   *ProblemReply `json:"-" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	// ที่อยู่ไฟล์บนเซิร์ฟเวอร์ + ชื่อไฟล์ต้นฉบับ (ใช้โชว์ใน UI)
	FilePath     string `json:"file_path"     gorm:"size:255;not null"`
	OriginalName string `json:"original_name" gorm:"size:255"`
}
