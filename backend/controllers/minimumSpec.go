package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func FindMinimumSpec(c *gin.Context) {
	var minimum_specs []entity.MinimumSpec
	if err := configs.DB().Find(&minimum_specs).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, minimum_specs)
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
