package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GET /permissions
func GetPermissions(c *gin.Context) {
	var permissions []entity.Permission
	if err := configs.DB().Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, permissions)
}

// GET /permissions/:id
func GetPermissionById(c *gin.Context) {
	id := c.Param("id")
	var permission entity.Permission
	if tx := configs.DB().Where("id = ?", id).First(&permission); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "permission not found"})
		return
	}
	c.JSON(http.StatusOK, permission)
}

// POST /permissions
func CreatePermission(c *gin.Context) {
	var permission entity.Permission
	if err := c.ShouldBindJSON(&permission); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Create(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, permission)
}

// PATCH /permissions/:id
func UpdatePermission(c *gin.Context) {
	id := c.Param("id")
	var permission entity.Permission
	if tx := configs.DB().Where("id = ?", id).First(&permission); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "permission not found"})
		return
	}

	var input entity.Permission
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Model(&permission).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, permission)
}

// DELETE /permissions/:id
func DeletePermission(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM permissions WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "permission not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
