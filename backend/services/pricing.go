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

	// พยายามอ่านโปรโมชันผ่าน raw SQL แบบยืดหยุ่น (รองรับชื่อคอลัมน์ที่ต่างกันได้บ้าง)
	type promoRow struct {
		Percent *float64
		Amount  *float64
		Price   *float64
	}

	var r promoRow
	// attempt #1: promotions + promotion_games (คอลัมน์ชื่อทั่วไป)
	err := db.Raw(`
		SELECT
			CAST(p.discount_percent AS REAL) AS percent,
			CAST(p.discount_amount  AS REAL) AS amount,
			CAST(p.special_price    AS REAL) AS price
		FROM promotions p
		JOIN promotion_games pg ON pg.promotion_id = p.id
		WHERE pg.game_id = ?
		  AND (p.start_at IS NULL OR p.start_at <= ?)
		  AND (p.end_at   IS NULL OR p.end_at   >= ?)
		  AND (p.is_active IS NULL OR p.is_active = 1)
		ORDER BY p.priority DESC, p.id DESC
		LIMIT 1
	`, gameID, now, now).Scan(&r).Error
	if err != nil {
		// attempt #2: บางโปรเจ็กต์ใช้ชื่อคอลัมน์อีกแบบ
		_ = db.Raw(`
			SELECT
				CAST(p.percent     AS REAL) AS percent,
				CAST(p.amount      AS REAL) AS amount,
				CAST(p.sale_price  AS REAL) AS price
			FROM promotions p
			JOIN promotion_games pg ON pg.promotion_id = p.id
			WHERE pg.game_id = ?
			  AND (p.starts_at IS NULL OR p.starts_at <= ?)
			  AND (p.ends_at   IS NULL OR p.ends_at   >= ?)
			  AND (p.active    IS NULL OR p.active = 1)
			ORDER BY p.id DESC
			LIMIT 1
		`, gameID, now, now).Scan(&r).Error
	}

	// เลือกวิธีลดที่ให้ "ราคาต่ำสุด" อย่างปลอดภัย
	price := base
	if r.Price != nil && *r.Price > 0 && *r.Price < price {
		price = *r.Price
	}
	if r.Percent != nil && *r.Percent > 0 {
		p := *r.Percent
		price = base * (100.0 - p) / 100.0
	}
	if r.Amount != nil && *r.Amount > 0 {
		if base-*r.Amount < price {
			price = base - *r.Amount
		} else if price-*r.Amount < price {
			price = price - *r.Amount
		}
	}

	if price < 0 {
		price = 0
	}
	return round2(price), nil
}
