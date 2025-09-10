package controllers

import (
	"os"
	"testing"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
)

func TestCalculateLineTotal_PercentPromotion(t *testing.T) {
	os.Setenv("DB_PATH", ":memory:")
	configs.ConnectionDB()
	db := configs.DB()
	db.Exec("PRAGMA foreign_keys = OFF")
	if err := db.AutoMigrate(&entity.Game{}, &entity.Promotion{}, &entity.Promotion_Game{}, &entity.KeyGame{}); err != nil {
		t.Fatalf("migrate failed: %v", err)
	}

	game := entity.Game{GameName: "Test", BasePrice: 100}
	if err := db.Create(&game).Error; err != nil {
		t.Fatalf("create game failed: %v", err)
	}

	promo := entity.Promotion{
		Title:         "Sale10",
		DiscountType:  entity.DiscountPercent,
		DiscountValue: 10,
		StartDate:     time.Now().Add(-time.Hour),
		EndDate:       time.Now().Add(time.Hour),
		Status:        true,
	}
	if err := db.Create(&promo).Error; err != nil {
		t.Fatalf("create promo failed: %v", err)
	}
	if err := db.Create(&entity.Promotion_Game{PromotionID: promo.ID, GameID: game.ID}).Error; err != nil {
		t.Fatalf("link promo failed: %v", err)
	}

	unitPrice, lineDiscount, lineTotal, err := calculateLineTotal(game.ID, 2, 0)
	if err != nil {
		t.Fatalf("calculateLineTotal returned error: %v", err)
	}
	if unitPrice != 100 {
		t.Errorf("unitPrice expected 100 got %v", unitPrice)
	}
	if lineDiscount != 20 {
		t.Errorf("lineDiscount expected 20 got %v", lineDiscount)
	}
	if lineTotal != 180 {
		t.Errorf("lineTotal expected 180 got %v", lineTotal)
	}
}
