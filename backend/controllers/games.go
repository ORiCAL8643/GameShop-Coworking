package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
    "example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /games
func CreateGame(c *gin.Context) {
	var body entity.Game
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
		return
	}
	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

// GET /games  (optional: ?name=...)
func FindGames(c *gin.Context) {
	var games []entity.Game
	name := c.Query("name")

	tx := configs.DB().Model(&entity.Game{})
	if name != "" {
		tx = tx.Where("game_name LIKE ?", "%"+name+"%")
	}

	if err := tx.Find(&games).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, games)
}

// GET /games/:id
func FindGameByID(c *gin.Context) {
	var game entity.Game
	if tx := configs.DB().First(&game, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, game)
}

// PUT /games/:id
func UpdateGame(c *gin.Context) {
	var payload entity.Game
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var game entity.Game
	db := configs.DB()
	if tx := db.First(&game, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	if err := db.Model(&game).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

// DELETE /games/:id
func DeleteGameByID(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM games WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
