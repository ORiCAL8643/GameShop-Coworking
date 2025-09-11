// entity/payment_slip.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type PaymentSlip struct {
	gorm.Model
	UploadAt time.Time `json:"upload_at"`
	FileURL  string    `json:"file_url"`

	PaymentID uint     `json:"payment_id"`
	Payment   *Payment `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
}
