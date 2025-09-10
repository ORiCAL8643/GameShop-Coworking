// entity/order_item.go
package entity

import "gorm.io/gorm"

type OrderItem struct {
	gorm.Model

	OrderID uint   `json:"order_id"`
	Order   *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`

	GameID uint  `json:"game_id"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game,omitempty"`

	QTY          int     `json:"qty"`
	UnitPrice    float64 `json:"unit_price"`
	LineDiscount float64 `json:"line_discount"`
	LineTotal    float64 `json:"line_total"`
}
