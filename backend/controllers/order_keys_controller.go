package controllers

import (
	"net/http"
	"strconv"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GET /orders/:id/keys  (ต้องเป็นเจ้าของหรือแอดมิน)
// คืนรายการคีย์เกมตามจำนวนที่สั่งซื้อ (ซ่อน code ไว้ก่อน)
func FindOrderKeys(c *gin.Context) {
	uidAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid := uidAny.(uint)

	orderID, _ := strconv.Atoi(c.Param("id"))
	if orderID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	db := configs.DB()

	var ord entity.Order
	if err := db.First(&ord, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}

	roleAny, _ := c.Get("roleID")
	isAdmin := roleAny != nil && roleAny.(uint) == configs.AdminRoleID()
	if !isAdmin && ord.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// ใช้เฉพาะ game_name (คอลัมน์จริงใน DB) ไม่อ้าง g.title แล้ว
	type row struct {
		ID       uint    `json:"id"`
		GameName string  `json:"game_name"`
		KeyCode  *string `json:"key_code,omitempty"` // ซ่อนโค้ดไว้ก่อน (nil)
	}

	var rows []row
	if err := db.Table("key_games AS kg").
		Select(`kg.id AS id,
		        COALESCE(g.game_name,'Unknown') AS game_name,
		        NULL AS key_code`).
		Joins("JOIN order_items oi ON oi.id = kg.owned_by_order_item_id").
		Joins("JOIN games g       ON g.id  = kg.game_id").
		Where("oi.order_id = ?", orderID).
		Order("kg.id ASC").
		Scan(&rows).Error; err != nil {
		// ถ้า query ผิดพลาด ให้ตอบ 500 เพื่อจะได้เห็น error ไม่เงียบ
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rows)
}

// POST /orders/:id/keys/:key_id/reveal  (ต้องเป็นเจ้าของหรือแอดมิน)
// คืนโค้ดจริงของคีย์เกม { "code": "XXXX-XXXX-..." }
func RevealOrderKey(c *gin.Context) {
	uidAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid := uidAny.(uint)

	orderID, _ := strconv.Atoi(c.Param("id"))
	keyID, _ := strconv.Atoi(c.Param("key_id"))
	if orderID <= 0 || keyID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	db := configs.DB()

	// ตรวจสิทธิ์ + ดึงโค้ด
	var row struct {
		UserID uint
		Code   string
	}
	if err := db.Table("key_games AS kg").
		Select("o.user_id AS user_id, kg.key_code AS code").
		Joins("JOIN order_items oi ON oi.id = kg.owned_by_order_item_id").
		Joins("JOIN orders o      ON o.id = oi.order_id").
		Where("o.id = ? AND kg.id = ?", orderID, keyID).
		Limit(1).Scan(&row).Error; err != nil || row.UserID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "key not found"})
		return
	}

	roleAny, _ := c.Get("roleID")
	isAdmin := roleAny != nil && roleAny.(uint) == configs.AdminRoleID()
	if !isAdmin && row.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	if row.Code == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "key not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": row.Code})
}
