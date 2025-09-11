// controllers/order_item_controller.go
package controllers

import (
	//"math"
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"example.com/sa-gameshop/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

//func round2(n float64) float64 { return math.Round(n*100) / 100 }

func recalcOrderTotal(db *gorm.DB, orderID uint) error {
	var items []entity.OrderItem
	if err := db.Where("order_id = ?", orderID).Find(&items).Error; err != nil {
		return err
	}
	sum := 0.0
	for _, it := range items {
		sum += it.LineTotal
	}
	return db.Model(&entity.Order{}).Where("id = ?", orderID).Update("total_amount", round2(sum)).Error
}

type createOrderItemRequest struct {
	OrderID uint `json:"order_id" binding:"required"`
	GameID  uint `json:"game_id" binding:"required"`
	QTY     int  `json:"qty" binding:"required"`
}

type updateQtyRequest struct {
	QTY int `json:"qty" binding:"required"`
}

func CreateOrderItem(c *gin.Context) {
	var body createOrderItemRequest
	if err := c.ShouldBindJSON(&body); err != nil || body.QTY == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if body.QTY < 0 {
		body.QTY = -body.QTY
	}
	if body.QTY == 0 {
		body.QTY = 1
	}

	db := configs.DB()
	var od entity.Order
	if tx := db.First(&od, body.OrderID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id not found"})
		return
	}

	now := time.Now()
	unit, err := services.GetDiscountedPriceForGame(db, body.GameID, now)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "game not found"})
		return
	}

	line := round2(unit * float64(body.QTY))
	item := entity.OrderItem{
		OrderID:      body.OrderID,
		GameID:       body.GameID,
		QTY:          body.QTY,
		UnitPrice:    round2(unit),
		LineDiscount: 0,
		LineTotal:    line,
	}
	if err := db.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_ = recalcOrderTotal(db, body.OrderID)
	_ = db.Preload("Order").Preload("Game").First(&item, item.ID)
	c.JSON(http.StatusCreated, item)
}

func FindOrderItems(c *gin.Context) {
	db := configs.DB().Preload("Order").Preload("Game")
	var rows []entity.OrderItem
	if oid := c.Query("order_id"); oid != "" {
		db = db.Where("order_id = ?", oid)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func UpdateOrderItemQty(c *gin.Context) {
	var body updateQtyRequest
	if err := c.ShouldBindJSON(&body); err != nil || body.QTY == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid qty"})
		return
	}
	if body.QTY < 0 {
		body.QTY = -body.QTY
	}

	db := configs.DB()
	var item entity.OrderItem
	if tx := db.First(&item, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}

	item.QTY = body.QTY
	item.LineTotal = round2(item.UnitPrice * float64(item.QTY))

	if err := db.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_ = recalcOrderTotal(db, item.OrderID)
	_ = db.Preload("Order").Preload("Game").First(&item, item.ID)
	c.JSON(http.StatusOK, item)
}

func DeleteOrderItem(c *gin.Context) {
	db := configs.DB()
	// ถ้ามี ref คีย์ให้เคลียร์ (ใช้ owned_by_order_item_id)
	_ = db.Model(&entity.KeyGame{}).Where("owned_by_order_item_id = ?", c.Param("id")).Update("owned_by_order_item_id", nil).Error

	var item entity.OrderItem
	if tx := db.First(&item, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	if err := db.Delete(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_ = recalcOrderTotal(db, item.OrderID)
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
