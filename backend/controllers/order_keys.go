package controllers

import (
	"net/http"
	"strings"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// maskKeyCode masks a key code leaving only the last 4 characters visible.
func maskKeyCode(code string) string {
	if len(code) <= 4 {
		return strings.Repeat("*", len(code))
	}
	return strings.Repeat("*", len(code)-4) + code[len(code)-4:]
}

// GET /orders/:orderId/keys
// เจ้าของ order เท่านั้น และต้องชำระเงินแล้ว
func FindOrderKeys(c *gin.Context) {
	uidAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := uidAny.(uint)
	orderID := c.Param("orderId")

	db := configs.DB()

	var order entity.Order
	if tx := db.First(&order, orderID); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	if order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	if order.OrderStatus != entity.OrderPaid && order.OrderStatus != entity.OrderFulfilled {
		c.JSON(http.StatusForbidden, gin.H{"error": "order not paid"})
		return
	}

	var keys []entity.KeyGame
	if err := db.Preload("Game").Joins("JOIN order_items ON key_games.owned_by_order_item_id = order_items.id").Where("order_items.order_id = ?", order.ID).Find(&keys).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for i := range keys {
		keys[i].KeyCode = maskKeyCode(keys[i].KeyCode)
	}

	c.JSON(http.StatusOK, keys)
}

// POST /orders/:orderId/keys/:keyId/reveal
// เจ้าของ order เท่านั้น คืนคีย์จริง และบันทึกว่าเปิดเผยแล้ว
func RevealOrderKey(c *gin.Context) {
	uidAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := uidAny.(uint)
	orderID := c.Param("orderId")
	keyID := c.Param("keyId")

	db := configs.DB()

	var order entity.Order
	if tx := db.First(&order, orderID); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	if order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	if order.OrderStatus != entity.OrderPaid && order.OrderStatus != entity.OrderFulfilled {
		c.JSON(http.StatusForbidden, gin.H{"error": "order not paid"})
		return
	}

	var key entity.KeyGame
	if tx := db.Preload("Game").Joins("JOIN order_items ON key_games.owned_by_order_item_id = order_items.id").Where("order_items.order_id = ? AND key_games.id = ?", order.ID, keyID).First(&key); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "key not found"})
		return
	}

	if !key.IsRevealed {
		now := time.Now()
		key.IsRevealed = true
		key.RevealedAt = &now
		if err := db.Save(&key).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, key)
}
