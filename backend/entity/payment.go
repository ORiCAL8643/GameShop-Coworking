// entity/payment.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type PaymentStatus string

const (
	PaymentSubmitted PaymentStatus = "SUBMITTED"
	PaymentApproved  PaymentStatus = "APPROVED"
	PaymentRejected  PaymentStatus = "REJECTED"
)

type Payment struct {
	gorm.Model

	OrderID uint   `json:"order_id"`
	Order   *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`

	Amount      float64       `json:"amount"`
	Status      PaymentStatus `json:"status" gorm:"type:varchar(16);index"`
	PaymentDate time.Time     `json:"payment_date"`

	SlipURL        string    `json:"slip_url"`
	SlipUploadedAt time.Time `json:"slip_uploaded_at"`

	ReviewedAt       *time.Time `json:"reviewed_at,omitempty"`
	ReviewedByUserID *uint      `json:"reviewed_by_user_id,omitempty"`
	RejectReason     string     `json:"reject_reason,omitempty"`
}
