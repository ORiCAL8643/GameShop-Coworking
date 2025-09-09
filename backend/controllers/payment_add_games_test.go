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

func TestAddGamesToPayment(t *testing.T) {
	os.Setenv("DB_PATH", "file::memory:?cache=shared")
	configs.ConnectionDB()
	db := configs.DB()
	if err := db.AutoMigrate(&entity.User{}, &entity.Order{}, &entity.Game{}, &entity.KeyGame{}, &entity.OrderItem{}, &entity.Payment{}, &entity.Categories{}, &entity.Promotion{}, &entity.Promotion_Game{}); err != nil {
		t.Fatalf("migrate failed: %v", err)
	}

	user := entity.User{Username: "tester"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	order := entity.Order{UserID: user.ID, OrderCreate: time.Now()}
	if err := db.Create(&order).Error; err != nil {
		t.Fatalf("create order: %v", err)
	}
	payment := entity.Payment{OrderID: order.ID, PaymentDate: time.Now(), Status: "PENDING", Amount: 0}
	if err := db.Create(&payment).Error; err != nil {
		t.Fatalf("create payment: %v", err)
	}

	cat := entity.Categories{Title: "Test"}
	if err := db.Create(&cat).Error; err != nil {
		t.Fatalf("create category: %v", err)
	}
	// disable FK for game-key
	db.Exec("PRAGMA foreign_keys = OFF")
	game := entity.Game{GameName: "Game1", BasePrice: 100, CategoriesID: int(cat.ID)}
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
		"payment_id": payment.ID,
		"game_ids":   []uint{game.ID},
	}
	b, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/payments/add-games", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	AddGamesToPayment(c)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", w.Code)
	}
	var resp struct {
		Payment    entity.Payment     `json:"payment"`
		OrderItems []entity.OrderItem `json:"order_items"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode resp: %v", err)
	}
	if resp.Payment.Amount != 90 {
		t.Fatalf("expected payment amount 90, got %v", resp.Payment.Amount)
	}
	if len(resp.OrderItems) != 1 || resp.OrderItems[0].LineTotal != 90 {
		t.Fatalf("unexpected order items: %+v", resp.OrderItems)
	}
}
