package services

import (
	"math"
	"time"

	"example.com/sa-gameshop/entity"
	"gorm.io/gorm"
)

// ปัดทศนิยม 2 ตำแหน่ง
func round2(v float64) float64 { return math.Round(v*100) / 100 }

// GetDiscountedPriceForGame คืน "ราคาสุทธิ" ของเกม ณ เวลานั้นๆ โดยพยายามมองหาโปรโมชันที่ active อยู่
// - ถ้าหาโปรไม่ได้/สคีม่าไม่ตรง → fallback เป็นราคาปกติของเกม (base price)
func GetDiscountedPriceForGame(db *gorm.DB, gameID uint, now time.Time) (float64, error) {
	var g entity.Game
	if err := db.First(&g, gameID).Error; err != nil {
		return 0, err
	}
	base := float64(g.BasePrice)

	// อ่านโปรโมชันที่กำลังใช้งานอยู่
	type promoRow struct {
		DiscountType  entity.DiscountType
		DiscountValue int
	}
	var promos []promoRow
	if err := db.Raw(`
                SELECT p.discount_type, p.discount_value
                FROM promotions p
                JOIN promotion_games pg ON pg.promotion_id = p.id
                WHERE pg.game_id = ? AND p.status = 1
                      AND p.start_date <= ? AND p.end_date >= ?
        `, gameID, now, now).Scan(&promos).Error; err != nil {
		return 0, err
	}

	// เลือกวิธีลดที่ให้ "ราคาต่ำสุด" อย่างปลอดภัย
	price := base
	for _, p := range promos {
		if discounted := ApplyDiscount(base, p.DiscountType, p.DiscountValue); discounted < price {
			price = discounted
		}
	}

	if price < 0 {
		price = 0
	}
	return round2(price), nil
}
