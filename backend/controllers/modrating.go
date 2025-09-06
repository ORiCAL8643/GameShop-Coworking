package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GET /modratings
func GetModRatings(c *gin.Context) {
	var ratings []entity.ModRating
	if err := configs.DB().Find(&ratings).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ratings)
}

// GET /modratings/:id
func GetModRatingById(c *gin.Context) {
	id := c.Param("id")
	var rating entity.ModRating
	if tx := configs.DB().Where("id = ?", id).First(&rating); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "rating not found"})
		return
	}
	c.JSON(http.StatusOK, rating)
}

// POST /modratings
func CreateModRating(c *gin.Context) {
	var rating entity.ModRating
	if err := c.ShouldBindJSON(&rating); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Create(&rating).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, rating)
}

// PATCH /modratings/:id
func UpdateModRating(c *gin.Context) {
	id := c.Param("id")
	var rating entity.ModRating
	if tx := configs.DB().Where("id = ?", id).First(&rating); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "rating not found"})
		return
	}

	var input entity.ModRating
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Model(&rating).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rating)
}

// DELETE /modratings/:id
func DeleteModRating(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM mod_ratings WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "rating not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
