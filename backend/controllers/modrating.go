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
	db := configs.DB().Preload("User")
	if mid := c.Query("mod_id"); mid != "" {
		db = db.Where("mod_id = ?", mid)
	}
	if err := db.Find(&ratings).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ratings)
}

// GET /modratings/:id
func GetModRatingById(c *gin.Context) {
	id := c.Param("id")
	var rating entity.ModRating
	if tx := configs.DB().Preload("User").Where("id = ?", id).First(&rating); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "rating not found"})
		return
	}
	c.JSON(http.StatusOK, rating)
}

// POST /modratings
func CreateModRating(c *gin.Context) {
	var body entity.ModRating
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Score < 0 || body.Score > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "score must be 0-5"})
		return
	}
	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
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
	if input.Score < 0 || input.Score > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "score must be 0-5"})
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
