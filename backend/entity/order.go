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
}
