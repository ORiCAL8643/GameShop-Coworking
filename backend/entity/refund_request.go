package entity

import (
	"time"

	"gorm.io/gorm"
)

type RefundRequest struct {
	gorm.Model
	OrderID        uint      `json:"order_id"`
	UserID         uint      `json:"user_id"`
	Reason         string    `json:"reason"`
	RequestDate    time.Time `json:"request_date"`
	ProcessedDate  time.Time `json:"processed_date"`
	Amount         float64   `json:"amount"`
	RefundStatusID uint      `json:"refund_status_id"`

	Attachments []RefundAttachment `gorm:"foreignKey:RefundID" json:"attachments"`
}
