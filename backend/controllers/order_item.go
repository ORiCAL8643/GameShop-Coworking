package controllers

import (
	"math"
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// payload สำหรับสร้าง OrderItem โดยไม่ให้ผู้ใช้กำหนดส่วนลดเอง
type createOrderItemRequest struct {
	UnitPrice    float64  `json:"unit_price" binding:"required"`
	QTY          int      `json:"qty" binding:"required"`
	OrderID      uint     `json:"order_id" binding:"required"`
	GameKeyID    *uint    `json:"game_key_id"`
	LineDiscount *float64 `json:"line_discount"`
	LineTotal    *float64 `json:"line_total"`
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

	// ตรวจ GameKey (ถ้าระบุ)
	var gameID uint
	if body.GameKeyID != nil {
		var gk entity.KeyGame
		if tx := db.First(&gk, *body.GameKeyID); tx.RowsAffected == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "game_key_id not found"})
			return
		}
		// ตรวจว่าคีย์เกมถูกใช้ไปแล้วหรือยัง (อาศัยคอลัมน์ order_item_id)
		var cnt int64
		db.Model(&entity.KeyGame{}).
			Where("id = ? AND order_item_id IS NOT NULL", *body.GameKeyID).
			Count(&cnt)
		if cnt > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "game key already assigned"})
			return
		}
		gameID = gk.GameID
	}

	// หาส่วนลดจากโปรโมชั่นที่ผูกกับเกมหรือออร์เดอร์
	sub := body.UnitPrice * float64(body.QTY)
	discount := 0.0

	now := time.Now()
	var promos []entity.Promotion
	// โปรโมชันจากเกม
	if gameID != 0 {
		var gamePromos []entity.Promotion
		db.Joins("JOIN promotion_games pg ON pg.promotion_id = promotions.id").
			Where("pg.game_id = ? AND promotions.status = 1 AND promotions.start_date <= ? AND promotions.end_date >= ?", gameID, now, now).
			Find(&gamePromos)
		promos = append(promos, gamePromos...)
	}
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
	// ตรวจสอบถ้ามีส่ง line_discount/line_total มาต้องตรงกับที่คำนวณ
	if body.LineDiscount != nil && math.Round(*body.LineDiscount*100)/100 != math.Round(discount*100)/100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "line_discount mismatch"})
		return
	}
	total := sub - discount
	total = math.Round(total*100) / 100
	if body.LineTotal != nil && math.Round(*body.LineTotal*100)/100 != total {
		c.JSON(http.StatusBadRequest, gin.H{"error": "line_total mismatch"})
		return
	}

	item := entity.OrderItem{
		UnitPrice:    body.UnitPrice,
		QTY:          body.QTY,
		LineDiscount: math.Round(discount*100) / 100,
		LineTotal:    total,
		OrderID:      body.OrderID,
		GameKeyID:    body.GameKeyID,
	}

	if err := db.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ถ้าผูก GameKey ให้ตั้ง owner
	if body.GameKeyID != nil {
		db.Model(&entity.KeyGame{}).
			Where("id = ?", *body.GameKeyID).
			Update("order_item_id", item.ID)
	}

	// อัปเดตราคารวมของออร์เดอร์หลังเพิ่มรายการใหม่
	db.Model(&entity.Order{}).
		Where("id = ?", body.OrderID).
		Update("total_amount", gorm.Expr("total_amount + ?", item.LineTotal))

	c.JSON(http.StatusCreated, item)
}

func FindOrderItems(c *gin.Context) {
	var rows []entity.OrderItem
	db := configs.DB().Preload("Order").Preload("KeyGame")
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
	var item entity.OrderItem
	if tx := db.First(&item, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	db.Model(&entity.KeyGame{}).Where("order_item_id = ?", c.Param("id")).Update("order_item_id", nil)

	if tx := db.Exec("DELETE FROM order_items WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	db.Model(&entity.Order{}).
		Where("id = ?", item.OrderID).
		Update("total_amount", gorm.Expr("total_amount - ?", item.LineTotal))

	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
