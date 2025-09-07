package entity

import "gorm.io/gorm"

type RefundStatus struct {
	gorm.Model
	StatusName string `json:"status_name"`

	RefundRequests []RefundRequest `gorm:"foreignKey:RefundStatusID" json:"refund_requests"`
}

