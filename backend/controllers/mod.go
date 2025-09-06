package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GET /mods
func GetMods(c *gin.Context) {
	var mods []entity.Mod
	if err := configs.DB().Find(&mods).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mods)
}

// GET /mods/:id
func GetModById(c *gin.Context) {
	id := c.Param("id")
	var mod entity.Mod
	if tx := configs.DB().Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}
	c.JSON(http.StatusOK, mod)
}

// POST /mods
func CreateMod(c *gin.Context) {
	var mod entity.Mod
	if err := c.ShouldBindJSON(&mod); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Create(&mod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, mod)
}

// PATCH /mods/:id
func UpdateMod(c *gin.Context) {
	id := c.Param("id")
	var mod entity.Mod
	if tx := configs.DB().Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}

	var input entity.Mod
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Model(&mod).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mod)
}

// DELETE /mods/:id
func DeleteMod(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM mods WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
