package controllers

import (
	"net/http"

	"gameshop-backend/configs"
	"gameshop-backend/entity/workshop"
	"github.com/gin-gonic/gin"
)

// GET /tags
func GetTags(c *gin.Context) {
	var tags []entity.Tags
	if err := configs.DB().Find(&tags).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tags)
}

// GET /tags/:id
func GetTagById(c *gin.Context) {
	id := c.Param("id")
	var tag entity.Tags
	if tx := configs.DB().Where("id = ?", id).First(&tag); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "tag not found"})
		return
	}
	c.JSON(http.StatusOK, tag)
}

// POST /tags
func CreateTag(c *gin.Context) {
	var tag entity.Tags
	if err := c.ShouldBindJSON(&tag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Create(&tag).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, tag)
}

// PATCH /tags/:id
func UpdateTag(c *gin.Context) {
	id := c.Param("id")
	var tag entity.Tags
	if tx := configs.DB().Where("id = ?", id).First(&tag); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "tag not found"})
		return
	}

	var input entity.Tags
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Model(&tag).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tag)
}

// DELETE /tags/:id
func DeleteTag(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM tags WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "tag not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
