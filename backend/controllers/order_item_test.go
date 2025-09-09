package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func TestCreateOrderItemWithPromotion(t *testing.T) {
	os.Setenv("DB_PATH", "file::memory:?cache=shared")
	configs.ConnectionDB()
	db := configs.DB()
	if err := db.AutoMigrate(&entity.User{}, &entity.Order{}, &entity.Game{}, &entity.KeyGame{}, &entity.OrderItem{}, &entity.Promotion{}, &entity.Promotion_Game{}, &entity.OrderPromotion{}); err != nil {
		t.Fatalf("migrate failed: %v", err)
	}

	// create user and order
	user := entity.User{Username: "tester"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	order := entity.Order{UserID: user.ID, OrderCreate: time.Now()}
	if err := db.Create(&order).Error; err != nil {
		t.Fatalf("create order: %v", err)
	}

	// create category, game and key
	cat := entity.Categories{Title: "Test"}
	if err := db.Create(&cat).Error; err != nil {
		t.Fatalf("create category: %v", err)
	}
	// disable FK to insert game before key
	db.Exec("PRAGMA foreign_keys = OFF")
	game := entity.Game{GameName: "TestGame", BasePrice: 100, CategoriesID: int(cat.ID)}
	if err := db.Create(&game).Error; err != nil {
		t.Fatalf("create game: %v", err)
	}
	key := entity.KeyGame{GameID: game.ID}
	if err := db.Create(&key).Error; err != nil {
		t.Fatalf("create key: %v", err)
	}
	if err := db.Model(&game).Update("key_game_id", key.ID).Error; err != nil {
		t.Fatalf("update game key: %v", err)
	}
	db.Exec("PRAGMA foreign_keys = ON")

	// create promotion for game
	now := time.Now()
	promo := entity.Promotion{
		Title:         "Promo10",
		DiscountType:  entity.DiscountPercent,
		DiscountValue: 10,
		StartDate:     now.Add(-time.Hour),
		EndDate:       now.Add(time.Hour),
		Status:        true,
		UserID:        user.ID,
	}
	if err := db.Create(&promo).Error; err != nil {
		t.Fatalf("create promo: %v", err)
	}
	if err := db.Create(&entity.Promotion_Game{PromotionID: promo.ID, GameID: game.ID}).Error; err != nil {
		t.Fatalf("link promo: %v", err)
	}

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	payload := map[string]interface{}{
		"unit_price":  100,
		"qty":         1,
		"order_id":    order.ID,
		"game_key_id": key.ID,
	}
	b, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/order-items", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	CreateOrderItem(c)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", w.Code)
	}
	var resp entity.OrderItem
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("invalid response: %v", err)
	}
	if resp.LineDiscount != 10 || resp.LineTotal != 90 {
		t.Fatalf("unexpected discount or total: %+v", resp)
	}
}
