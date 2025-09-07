package entity

import (
	"gorm.io/gorm"
)

type KeyGame struct {
	gorm.Model
	Key    string `json:"key" gorm:"uniqueIndex; type:text; default:(lower(hex(randomblob(16))))"`
	GameID uint   `json:"game_id"`
	Game   Game   `json:"game"`

	// หากคีย์ถูกมอบให้กับรายการสั่งซื้อแล้ว จะมีการอ้างอิงไปยัง OrderItem
	OrderItemID *uint      `json:"order_item_id"`
	OrderItem   *OrderItem `gorm:"foreignKey:OrderItemID" json:"order_item,omitempty"`
}
