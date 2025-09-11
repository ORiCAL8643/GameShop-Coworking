// entity/key_game.go
package entity

import "gorm.io/gorm"

type KeyGame struct {
	gorm.Model

	GameID uint  `json:"game_id"`
	Game   *Game `gorm:"foreignKey:GameID" json:"game,omitempty"`

	KeyCode string `json:"key_code" gorm:"uniqueIndex"`

	// จองคีย์ให้ OrderItem ไหน (nil = ว่าง)
	OwnedByOrderItemID *uint      `json:"owned_by_order_item_id"`
	OwnedByOrderItem   *OrderItem `gorm:"foreignKey:OwnedByOrderItemID" json:"owned_by_order_item,omitempty"`
}
