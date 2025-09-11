// entity/order.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type OrderStatus string

const (
	OrderWaitingPayment OrderStatus = "WAITING_PAYMENT"
	OrderUnderReview    OrderStatus = "UNDER_REVIEW"
	OrderPaid           OrderStatus = "PAID"
	OrderFulfilled      OrderStatus = "FULFILLED"
	OrderCancelled      OrderStatus = "CANCELLED"
	OrderRefunded       OrderStatus = "REFUNDED"
)

type Order struct {
	gorm.Model

	TotalAmount float64     `json:"total_amount"`
	OrderCreate time.Time   `json:"order_create"`
	OrderStatus OrderStatus `json:"order_status" gorm:"type:varchar(32);index"`

	UserID uint  `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	OrderItems []OrderItem `gorm:"foreignKey:OrderID" json:"order_items,omitempty"`
	Payments   []Payment   `gorm:"foreignKey:OrderID" json:"payments,omitempty"`
	// ❌ ลบ KeyGame []KeyGame ที่เคยอยู่บน Order ออก (คีย์ผูกกับ OrderItem)
}

// ใช้ชื่อ field ตามที่ controller อ้างอิง (UnitPrice, LineDiscount, LineTotal, QTY, GameID)
type Order_Item struct {
	gorm.Model
	OrderID uint `json:"order_id"`

	GameID uint `json:"game_id"`
	Game   Game `json:"game" gorm:"foreignKey:ID;references:GameID"`

	QTY          int     `json:"qty"`
	UnitPrice    float64 `json:"unit_price"`
	LineDiscount float64 `json:"line_discount"`
	LineTotal    float64 `json:"line_total"`

	// ✅ คีย์ที่ “ถูกจัดสรรแล้ว” ให้รายการนี้
	GameKeys []KeyGame `gorm:"foreignKey:OwnedByOrderItemID" json:"game_keys,omitempty"`
}
