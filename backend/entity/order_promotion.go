// entity/order_promotion.go
package entity

import "gorm.io/gorm"

// ตารางกลาง Order <> Promotion พร้อม field ส่วนลดที่ใช้จริงกับออเดอร์นั้น
type OrderPromotion struct {
	gorm.Model
	DiscountAmount float64 `json:"discount_amount"`

	OrderID uint   `json:"order_id"`
	Order   *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`

	PromotionID uint       `json:"promotion_id"`
	Promotion   *Promotion `gorm:"foreignKey:PromotionID" json:"promotion,omitempty"`
}
