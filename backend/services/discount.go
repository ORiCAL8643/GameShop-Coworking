package services

import "example.com/sa-gameshop/entity"

// ApplyDiscount applies a discount described by type and value to the given price.
// It returns the price after discount, ensuring it doesn't go below zero.
func ApplyDiscount(price float64, t entity.DiscountType, v int) float64 {
	if v <= 0 {
		return price
	}
	switch t {
	case entity.DiscountPercent:
		return price * (1.0 - float64(v)/100.0)
	case entity.DiscountAmount:
		if price < float64(v) {
			return 0
		}
		return price - float64(v)
	default:
		return price
	}
}
