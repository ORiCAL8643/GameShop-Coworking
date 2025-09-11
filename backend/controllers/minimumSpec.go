package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func FindMinimumSpec(c *gin.Context) {
	var minimum_specs []entity.MinimumSpec
	if err := configs.DB().Preload("Game").Find(&minimum_specs).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, minimum_specs)
}

// GET /games/:id/minimumspec
func FindMinimumSpecByGameID(c *gin.Context) {
	id := c.Param("id")

	var ms entity.MinimumSpec
	if err := configs.DB().Where("game_id = ?", id).First(&ms).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "minimum spec not found"})
		return
	}
	c.JSON(http.StatusOK, ms)
}
func CreateMinimumSpec(c *gin.Context) {
	var minimum_specs entity.MinimumSpec
	if err := c.ShouldBindJSON(&minimum_specs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Create(&minimum_specs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, minimum_specs)
}
