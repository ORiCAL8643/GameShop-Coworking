package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// orderKeyResp defines the JSON shape returned for each key.
type orderKeyResp struct {
	ID         uint    `json:"id"`
	GameName   string  `json:"game_name"`
	KeyCode    *string `json:"key_code"`
	IsRevealed bool    `json:"is_revealed"`
}

// GET /orders/:id/keys
// คืนรายการคีย์เกมของคำสั่งซื้อ (owner หรือ admin เท่านั้น)
func FindOrderKeys(c *gin.Context) {
	uidAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid := uidAny.(uint)

	roleAny, _ := c.Get("roleID")
	isAdmin := roleAny != nil && roleAny.(uint) == configs.AdminRoleID()

	orderID := c.Param("id")
	var od entity.Order
	if tx := configs.DB().First(&od, orderID); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	if !isAdmin && od.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	type row struct {
		ID         uint
		GameName   string
		RevealedAt *time.Time
	}
	var rows []row
	db := configs.DB()
	db.Table("key_games").
		Select("key_games.id as id, games.game_name as game_name, key_games.revealed_at as revealed_at").
		Joins("JOIN order_items ON key_games.owned_by_order_item_id = order_items.id").
		Joins("JOIN games ON order_items.game_id = games.id").
		Where("order_items.order_id = ?", orderID).
		Scan(&rows)

	result := make([]orderKeyResp, 0, len(rows))
	for _, r := range rows {
		result = append(result, orderKeyResp{
			ID:         r.ID,
			GameName:   r.GameName,
			KeyCode:    nil,
			IsRevealed: r.RevealedAt != nil,
		})
	}
	c.JSON(http.StatusOK, result)
}

// POST /orders/:id/keys/:key_id/reveal
// เปิดเผยคีย์เกมจริง (owner หรือ admin เท่านั้น)
func RevealOrderKey(c *gin.Context) {
	uidAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid := uidAny.(uint)

	roleAny, _ := c.Get("roleID")
	isAdmin := roleAny != nil && roleAny.(uint) == configs.AdminRoleID()

	orderID := c.Param("id")
	keyID := c.Param("key_id")

	var od entity.Order
	if tx := configs.DB().First(&od, orderID); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	if !isAdmin && od.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	db := configs.DB()
	var kg entity.KeyGame
	if tx := db.
		Joins("JOIN order_items ON key_games.owned_by_order_item_id = order_items.id").
		Joins("JOIN games ON order_items.game_id = games.id").
		Where("key_games.id = ? AND order_items.order_id = ?", keyID, orderID).
		Preload("Game").
		First(&kg); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "key not found"})
		return
	}

	if kg.RevealedAt == nil {
		now := time.Now()
		if err := db.Model(&entity.KeyGame{}).Where("id = ?", kg.ID).Update("revealed_at", now).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		kg.RevealedAt = &now
	}

	c.JSON(http.StatusOK, orderKeyResp{
		ID:         kg.ID,
		GameName:   kg.Game.GameName,
		KeyCode:    &kg.KeyCode,
		IsRevealed: true,
	})
}
