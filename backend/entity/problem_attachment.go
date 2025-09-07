package entity

import "gorm.io/gorm"
type ProblemAttachment struct {
	gorm.Model
	FilePath   string `json:"file_path"`
	UploadedAt string `json:"uploaded_at"`

	ReportID uint `json:"report_id"`
}

