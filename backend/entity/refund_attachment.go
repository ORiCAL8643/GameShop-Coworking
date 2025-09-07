package entity

import (
	"time"

	"gorm.io/gorm"
)

type RefundAttachment struct {
	gorm.Model
	FilePath   string    `json:"file_path"`
	UploadedAt time.Time `json:"uploaded_at"`

	RefundID uint `json:"refund_id"`
}
