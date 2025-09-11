// services/pricing.go
package services

import (
	"time"

	"example.com/sa-gameshop/entity"
	"gorm.io/gorm"
)

// ปรับเพิ่ม logic โปรโมชันได้ที่นี่ (ตอนนี้ใช้ BasePrice ตรง ๆ)
func GetDiscountedPriceForGame(db *gorm.DB, gameID uint, now time.Time) (float64, error) {
	var g entity.Game
	if err := db.First(&g, gameID).Error; err != nil {
		return 0, err
	}
	return float64(g.BasePrice), nil
}
