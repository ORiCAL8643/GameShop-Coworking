package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GET /ownergames
func GetOwnerGames(c *gin.Context) {
	var ownergames []entity.OwnerGame
	if err := configs.DB().Find(&ownergames).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ownergames)
}

// GET /ownergames/:id
func GetOwnerGameById(c *gin.Context) {
	id := c.Param("id")
	var ownergame entity.OwnerGame
	if tx := configs.DB().Where("id = ?", id).First(&ownergame); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ownergame not found"})
		return
	}
	c.JSON(http.StatusOK, ownergame)
}

// POST /ownergames
func CreateOwnerGame(c *gin.Context) {
	var ownergame entity.OwnerGame
	if err := c.ShouldBindJSON(&ownergame); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Create(&ownergame).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, ownergame)
}

// PATCH /ownergames/:id
func UpdateOwnerGame(c *gin.Context) {
	id := c.Param("id")
	var ownergame entity.OwnerGame
	if tx := configs.DB().Where("id = ?", id).First(&ownergame); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ownergame not found"})
		return
	}

	var input entity.OwnerGame
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Model(&ownergame).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ownergame)
}

// DELETE /ownergames/:id
func DeleteOwnerGame(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM owner_games WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ownergame not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
