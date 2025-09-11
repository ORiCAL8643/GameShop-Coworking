// entity/order.go
package entity

import (
	"time"

	"gorm.io/gorm"
)

type Order struct {
	gorm.Model
	TotalAmount float64   `json:"total_amount"`
	OrderCreate time.Time `json:"order_create"`
	OrderStatus string    `json:"order_status"`

	UserID uint  `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// relations
	OrderItems      []OrderItem      `gorm:"foreignKey:OrderID" json:"order_items,omitempty"`
	Payments        []Payment        `gorm:"foreignKey:OrderID" json:"payments,omitempty"`
	OrderPromotions []OrderPromotion `gorm:"foreignKey:OrderID" json:"order_promotions,omitempty"`
}
