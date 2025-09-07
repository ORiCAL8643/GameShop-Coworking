package controllers

import (
	"math"
	"net/http"

	"example.com/sa-gameshop/configs"
    "example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func CreateOrderItem(c *gin.Context) {
	var body entity.OrderItem
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
	if body.GameKeyID != nil {
		var gk entity.KeyGame
		if tx := db.First(&gk, *body.GameKeyID); tx.RowsAffected == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "game_key_id not found"})
			return
		}
		if gk.OrderItemID != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "game key already assigned"})
			return
		}
	}

	// คำนวณ line total แบบง่าย
	sub := body.UnitPrice * float64(body.QTY)
	total := sub - body.LineDiscount
	if total < 0 {
		total = 0
	}
	body.LineTotal = math.Round(total*100) / 100

	if err := db.Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ถ้าผูก GameKey ให้ตั้ง owner
	if body.GameKeyID != nil {
		db.Model(&entity.KeyGame{}).
			Where("id = ?", *body.GameKeyID).
			Update("order_item_id", body.ID)
	}

	c.JSON(http.StatusCreated, body)
}

func FindOrderItems(c *gin.Context) {
	var rows []entity.OrderItem
	db := configs.DB().Preload("Order").Preload("GameKey")
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
