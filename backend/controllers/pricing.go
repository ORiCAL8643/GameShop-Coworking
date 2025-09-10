package controllers

import (
	"errors"
	"math"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
)

// calculateLineTotal คำนวณราคาต่อเกมรวมถึงส่วนลดจากโปรโมชัน
// หาก orderID เป็น 0 จะไม่นำโปรโมชันที่ผูกกับออร์เดอร์มาคำนวณ
func calculateLineTotal(gameID uint, qty int, orderID uint) (unitPrice float64, lineDiscount float64, lineTotal float64, err error) {
	db := configs.DB()

	if qty <= 0 {
		qty = 1
	}

	var game entity.Game
	if tx := db.First(&game, gameID); tx.RowsAffected == 0 {
		return 0, 0, 0, errors.New("game_id not found")
	}
	unitPrice = float64(game.BasePrice)
	sub := unitPrice * float64(qty)

	discount := 0.0
	now := time.Now()
	var promos []entity.Promotion

	// promotions from game
	db.Joins("JOIN promotion_games pg ON pg.promotion_id = promotions.id").
		Where("pg.game_id = ? AND promotions.status = 1 AND promotions.start_date <= ? AND promotions.end_date >= ?", gameID, now, now).
		Find(&promos)

	// promotions from order
	if orderID > 0 {
		var orderPromos []entity.Promotion
		db.Joins("JOIN order_promotions op ON op.promotion_id = promotions.id").
			Where("op.order_id = ? AND promotions.status = 1 AND promotions.start_date <= ? AND promotions.end_date >= ?", orderID, now, now).
			Find(&orderPromos)
		promos = append(promos, orderPromos...)
	}

	for _, p := range promos {
		var d float64
		if p.DiscountType == entity.DiscountPercent {
			d = sub * float64(p.DiscountValue) / 100
		} else if p.DiscountType == entity.DiscountAmount {
			d = float64(p.DiscountValue) * float64(qty)
		}
		if d > discount {
			discount = d
		}
	}
	if discount > sub {
		discount = sub
	}

	lineTotal = sub - discount
	lineDiscount = math.Round(discount*100) / 100
	lineTotal = math.Round(lineTotal*100) / 100
	return
}
