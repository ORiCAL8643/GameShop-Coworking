package controllers

import (
	"math"
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// payload สำหรับสร้าง OrderItem โดยให้ส่งเฉพาะเกมและจำนวน
type createOrderItemRequest struct {
	GameID  uint `json:"game_id" binding:"required"`
	QTY     int  `json:"qty" binding:"required"`
	OrderID uint `json:"order_id" binding:"required"`
}

func CreateOrderItem(c *gin.Context) {
	var body createOrderItemRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	db := configs.DB()

	// ตรวจ Order
	var od entity.Order
	if tx := db.First(&od, body.OrderID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id not found"})
		return
	}

	// ตรวจ Game และดึงราคาเกม
	var game entity.Game
	if tx := db.First(&game, body.GameID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "game_id not found"})
		return
	}
	unitPrice := float64(game.BasePrice)

	// หาส่วนลดจากโปรโมชั่นที่ผูกกับเกมหรือออร์เดอร์
	sub := unitPrice * float64(body.QTY)
	discount := 0.0

	now := time.Now()
	var promos []entity.Promotion
	// โปรโมชันจากเกม
	var gamePromos []entity.Promotion
	db.Joins("JOIN promotion_games pg ON pg.promotion_id = promotions.id").
		Where("pg.game_id = ? AND promotions.status = 1 AND promotions.start_date <= ? AND promotions.end_date >= ?", body.GameID, now, now).
		Find(&gamePromos)
	promos = append(promos, gamePromos...)
	// โปรโมชันจากออร์เดอร์
	var orderPromos []entity.Promotion
	db.Joins("JOIN order_promotions op ON op.promotion_id = promotions.id").
		Where("op.order_id = ? AND promotions.status = 1 AND promotions.start_date <= ? AND promotions.end_date >= ?", body.OrderID, now, now).
		Find(&orderPromos)
	promos = append(promos, orderPromos...)

	for _, p := range promos {
		var d float64
		if p.DiscountType == entity.DiscountPercent {
			d = sub * float64(p.DiscountValue) / 100
		} else if p.DiscountType == entity.DiscountAmount {
			d = float64(p.DiscountValue) * float64(body.QTY)
		}
		if d > discount {
			discount = d
		}
	}
	if discount > sub {
		discount = sub
	}
	total := sub - discount
	total = math.Round(total*100) / 100

	item := entity.OrderItem{
		UnitPrice:    unitPrice,
		QTY:          body.QTY,
		LineDiscount: math.Round(discount*100) / 100,
		LineTotal:    total,
		OrderID:      body.OrderID,
		GameID:       body.GameID,
	}

	if err := db.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, item)
}

func FindOrderItems(c *gin.Context) {
	var rows []entity.OrderItem
	db := configs.DB().Preload("Order").Preload("Game").Preload("KeyGames")
	orderID := c.Query("order_id")
	if orderID != "" {
		db = db.Where("order_id = ?", orderID)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func UpdateOrderItem(c *gin.Context) {
	var payload entity.OrderItem
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := configs.DB()
	var row entity.OrderItem
	if tx := db.First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	if err := db.Model(&row).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

func DeleteOrderItem(c *gin.Context) {
	// เคลียร์การอ้างอิง GameKey ก่อน
	db := configs.DB()
	db.Model(&entity.KeyGame{}).Where("order_item_id = ?", c.Param("id")).Update("order_item_id", nil)

	if tx := db.Exec("DELETE FROM order_items WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
