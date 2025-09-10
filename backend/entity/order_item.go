// entity/order_item.go
package entity

import "gorm.io/gorm"

type OrderItem struct {
	gorm.Model
	UnitPrice    float64 `json:"unit_price"`
	QTY          int     `json:"qty"`
	LineDiscount float64 `json:"line_discount"`
	LineTotal    float64 `json:"line_total"`

	OrderID uint   `json:"order_id"`
	Order   *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`

	GameID uint  `json:"game_id"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game,omitempty"`

	KeyGames []KeyGame `gorm:"foreignKey:OrderItemID" json:"key_games,omitempty"`
}
