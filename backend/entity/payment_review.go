// entity/payment_review.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

// บันทึกผลการตรวจสลิป/การชำระ (โดยแอดมิน)
type PaymentReview struct {
	gorm.Model
	VerifiedAt time.Time `json:"verified_at"`
	Title      string    `json:"title"`
	Result     string    `json:"result"` // e.g. "approved" | "rejected"
	Note       string    `json:"note"`

	UserID uint  `json:"user_id"` // ผู้ตรวจ
	User   *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// ถ้าต้องการโยงกับ Payment/Order เฉพาะเจาะจง สามารถเพิ่ม FK เพิ่มได้ภายหลัง
}
