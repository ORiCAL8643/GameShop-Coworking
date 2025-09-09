// entity/payment.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type Payment struct {
	gorm.Model
	PaymentDate  time.Time `json:"payment_date"`
	Status       string    `json:"status"`
	Amount       float64   `json:"amount"`
	RejectReason string    `json:"reject_reason"`

	OrderID uint   `json:"order_id"`
	Order   *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`

	PaymentSlips []PaymentSlip `gorm:"foreignKey:PaymentID" json:"payment_slips,omitempty"`
}
