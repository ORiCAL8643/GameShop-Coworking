// entity/order_item.go
package entity

import "gorm.io/gorm"

type OrderItem struct {
	gorm.Model
	UnitPrice   float64 `json:"unit_price"`
	QTY         int     `json:"qty"`
	LineDiscount float64 `json:"line_discount"`
	LineTotal   float64 `json:"line_total"`

	OrderID uint   `json:"order_id"`
	Order   *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`

	// ผูกคีย์เกมที่เบิกให้รายการนี้ (ถ้ามี)
	GameKeyID *uint    `json:"game_key_id"`
	KeyGame   *KeyGame `gorm:"foreignKey:GameKeyID" json:"key_game,omitempty"`
}
