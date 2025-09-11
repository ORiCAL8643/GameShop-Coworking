package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// ===== Payloads =====

type createKeyGameBody struct {
	GameID  uint   `json:"game_id" binding:"required"`
	KeyCode string `json:"key_code" binding:"required"`
}

// ===== Handlers =====

// POST /keygames
// สร้างคีย์ใหม่ (ต้องเป็นคีย์ว่าง ยังไม่ถูกจอง)
func CreateKeyGame(c *gin.Context) {
	var body createKeyGameBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	db := configs.DB()

	// ตรวจว่าเกมมีจริง
	var g entity.Game
	if tx := db.First(&g, body.GameID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "game_id not found"})
		return
	}

	// ตรวจ key_code ไม่ว่าง/ไม่ซ้ำ (ตัดช่องว่าง)
	body.KeyCode = strings.TrimSpace(body.KeyCode)
	if body.KeyCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "key_code required"})
		return
	}
	var dup int64
	db.Model(&entity.KeyGame{}).Where("key_code = ?", body.KeyCode).Count(&dup)
	if dup > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "key_code already exists"})
		return
	}

	row := entity.KeyGame{
		GameID:               body.GameID,
		KeyCode:              body.KeyCode,
		OwnedByOrderItemID:   nil, // คีย์ว่าง
	}
	if err := db.Create(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_ = db.Preload("Game").First(&row, row.ID)
	c.JSON(http.StatusCreated, row)
}

// GET /keygames
// query:
//   ?game_id=<id>          -> กรองตามเกม
//   ?only_available=1/true -> เอาเฉพาะคีย์ว่าง (owned_by_order_item_id IS NULL)
func FindKeyGames(c *gin.Context) {
	db := configs.DB().Preload("Game").Preload("OwnedByOrderItem")

	if gid := c.Query("game_id"); gid != "" {
		db = db.Where("game_id = ?", gid)
	}
	if av := c.Query("only_available"); av != "" {
		if av == "1" || strings.EqualFold(av, "true") {
			db = db.Where("owned_by_order_item_id IS NULL")
		}
	}

	var rows []entity.KeyGame
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// GET /keygames/:id
func FindKeyGameByID(c *gin.Context) {
	var row entity.KeyGame
	if tx := configs.DB().Preload("Game").Preload("OwnedByOrderItem").First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, row)
}

// DELETE /keygames/:id
// ลบได้เฉพาะคีย์ที่ยังไม่ถูกจอง
func DeleteKeyGame(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id required"})
		return
	}
	id, _ := strconv.Atoi(idStr)

	db := configs.DB()
	var row entity.KeyGame
	if tx := db.First(&row, id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	if row.OwnedByOrderItemID != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "key already assigned; cannot delete"})
		return
	}
	if err := db.Delete(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
