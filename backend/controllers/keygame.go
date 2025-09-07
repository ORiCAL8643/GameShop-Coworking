package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

/*
// POST /keygames
func CreateKeyGame(c *gin.Context) {
	var body entity.KeyGame
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	// ตรวจสอบเกมที่เกี่ยวข้อง
	var game entity.Game
	db := configs.DB()
	if tx := db.First(&game, body.GameID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "game_id not found"})
		return
	}
	if err := db.Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

// GET /keygames
func FindKeyGames(c *gin.Context) {
	var rows []entity.KeyGame
	db := configs.DB().Preload("Game").Preload("OrderItem")
	if gameID := c.Query("game_id"); gameID != "" {
		db = db.Where("game_id = ?", gameID)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// GET /keygames/:id
func FindKeyGameByID(c *gin.Context) {
	var row entity.KeyGame
	if tx := configs.DB().Preload("Game").Preload("OrderItem").First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, row)
}

// DELETE /keygames/:id
func DeleteKeyGame(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM key_games WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
*/

func CreateKeyGame(c *gin.Context) {
	var keygame entity.KeyGame
	if err := c.ShouldBindJSON(&keygame); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// สร้าง record ใหม่ลง DB
	if err := configs.DB().Create(&keygame).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// ส่งข้อมูล category ที่เพิ่งสร้างกลับไปให้ frontend
	c.JSON(http.StatusOK, keygame)
}
func FindKeyGame(c *gin.Context) {
	var keygame []entity.KeyGame
	if err := configs.DB().Preload("Game").Find(&keygame).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, keygame)
}

func DeleteKeyGameById(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM KeyGame WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted succesful"})
}
