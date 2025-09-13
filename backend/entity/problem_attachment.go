package entity

import "gorm.io/gorm"

// ไฟล์แนบที่ลูกค้าอัปโหลดตอนส่ง Report
type ProblemAttachment struct {
	gorm.Model

	// FK ไปยัง ProblemReport
	ReportID uint           `json:"report_id" gorm:"not null;index"`
	Report   *ProblemReport `json:"-"         gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	// ที่อยู่ไฟล์ + ชื่อไฟล์เดิม (ช่วยให้ UI โชว์ชื่อที่เข้าใจได้)
	FilePath     string `json:"file_path"     gorm:"size:255;not null"`
	OriginalName string `json:"original_name" gorm:"size:255"`
}
