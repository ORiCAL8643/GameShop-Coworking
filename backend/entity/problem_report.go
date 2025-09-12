package entity

import (
	"time"

	"gorm.io/gorm"
)

// คำร้องจากลูกค้า
type ProblemReport struct {
	gorm.Model

	Title       string `json:"title"       gorm:"type:varchar(200);not null"`
	Description string `json:"description" gorm:"type:text;not null"`
	Category    string `json:"category"    gorm:"type:varchar(100);default:'Other';index"`

	// ผู้ส่งคำร้อง
	UserID uint  `json:"user_id" gorm:"not null;index"`
	User   *User `json:"user"    gorm:"foreignKey:UserID"`

	// เกมที่เกี่ยวข้อง (ถ้ามี)
	GameID uint  `json:"game_id" gorm:"index"`
	Game   *Game `json:"game"    gorm:"foreignKey:GameID"`

	// สถานะการดำเนินงาน
	// ใช้ค่า: open | in_progress | resolved
	Status     string     `json:"status"      gorm:"type:varchar(30);default:'open';index"`
	ResolvedAt *time.Time `json:"resolved_at"` // อนุญาตให้เป็น null

	// แนบไฟล์ของลูกค้า
	Attachments []ProblemAttachment `json:"attachments" gorm:"foreignKey:ReportID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	// ความสัมพันธ์กับตารางตอบกลับของแอดมิน
	Replies []ProblemReply `json:"replies" gorm:"foreignKey:ReportID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}
