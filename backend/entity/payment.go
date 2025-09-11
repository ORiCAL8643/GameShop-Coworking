package entity

import (
        "time"

        "gorm.io/gorm"
)

type PaymentStatus string

const (
	PaymentPending  PaymentStatus = "PENDING"
	PaymentApproved PaymentStatus = "APPROVED"
	PaymentRejected PaymentStatus = "REJECTED"
)

type Payment struct {
        gorm.Model
        OrderID      uint          `json:"order_id"`
        Order        Order         `json:"order"` // ต้องมี entity.Order อยู่แล้ว (UserID, TotalAmount, OrderStatus)
        Amount       float64       `json:"amount"`
        Status       PaymentStatus `json:"status"`
        RejectReason *string       `json:"reject_reason"` // ใช้ *string เพื่อให้ null ได้
        SlipPath     string        `json:"slip_path"`     // path ใต้ ./uploads
        UploadedAt   time.Time     `json:"uploaded_at"`
}
