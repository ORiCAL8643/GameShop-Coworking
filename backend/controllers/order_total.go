package controllers

import (
	"math"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
)

// updateOrderTotal recalculates the total amount for the given order ID
// by summing line totals from order_items and updating the order record.
func updateOrderTotal(orderID uint) (float64, error) {
	db := configs.DB()
	var total float64
	if err := db.Model(&entity.OrderItem{}).
		Where("order_id = ?", orderID).
		Select("COALESCE(SUM(line_total),0)").
		Scan(&total).Error; err != nil {
		return 0, err
	}
	total = math.Round(total*100) / 100
	if err := db.Model(&entity.Order{}).Where("id = ?", orderID).Update("total_amount", total).Error; err != nil {
		return 0, err
	}
	return total, nil
}
