package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func FindCategories(c *gin.Context) {
	var categories []entity.Categories
	if err := configs.DB().Raw("SELECT * FROM categories").Find(&categories).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, categories)
}
