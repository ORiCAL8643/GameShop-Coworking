package entity

import "gorm.io/gorm"

type Notification struct {
	gorm.Model
	Title   string `json:"title"`
	Type    string `json:"type"`    // เช่น "report_reply", "refund", "system"
	Message string `json:"message"`

	UserID uint  `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	IsRead bool `json:"is_read" gorm:"default:false"`

	// ✅ อ้างอิงคำร้อง เพื่อให้หน้า UI เปิดดูรายละเอียด/ไฟล์แนบได้
	ReportID *uint          `json:"report_id"`
	Report   *ProblemReport `gorm:"foreignKey:ReportID" json:"report,omitempty"`
}
