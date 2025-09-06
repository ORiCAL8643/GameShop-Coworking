package controllers

import (
	"net/http"

	"gameshop-backend/configs"
	"gameshop-backend/entity/workshop"
	"github.com/gin-gonic/gin"
)

// GET /modtags
func GetModTags(c *gin.Context) {
	var modtags []entity.ModTags
	if err := configs.DB().Find(&modtags).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, modtags)
}

// GET /modtags/:id
func GetModTagById(c *gin.Context) {
	id := c.Param("id")
	var modtag entity.ModTags
	if tx := configs.DB().Where("id = ?", id).First(&modtag); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "modtag not found"})
		return
	}
	c.JSON(http.StatusOK, modtag)
}

// POST /modtags
func CreateModTag(c *gin.Context) {
	var modtag entity.ModTags
	if err := c.ShouldBindJSON(&modtag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Create(&modtag).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, modtag)
}

// PATCH /modtags/:id
func UpdateModTag(c *gin.Context) {
	id := c.Param("id")
	var modtag entity.ModTags
	if tx := configs.DB().Where("id = ?", id).First(&modtag); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "modtag not found"})
		return
	}

	var input entity.ModTags
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Model(&modtag).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, modtag)
}

// DELETE /modtags/:id
func DeleteModTag(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM mod_tags WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "modtag not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
