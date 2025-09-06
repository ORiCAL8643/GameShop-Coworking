package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GET /rolepermissions
func GetRolePermissions(c *gin.Context) {
	var rolePermissions []entity.RolePermission
	if err := configs.DB().Find(&rolePermissions).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rolePermissions)
}

// GET /rolepermissions/:id
func GetRolePermissionById(c *gin.Context) {
	id := c.Param("id")
	var rolePermission entity.RolePermission
	if tx := configs.DB().Where("id = ?", id).First(&rolePermission); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "role_permission not found"})
		return
	}
	c.JSON(http.StatusOK, rolePermission)
}

// POST /rolepermissions
func CreateRolePermission(c *gin.Context) {
	var rolePermission entity.RolePermission
	if err := c.ShouldBindJSON(&rolePermission); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Create(&rolePermission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, rolePermission)
}

// PATCH /rolepermissions/:id
func UpdateRolePermission(c *gin.Context) {
	id := c.Param("id")
	var rolePermission entity.RolePermission
	if tx := configs.DB().Where("id = ?", id).First(&rolePermission); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "role_permission not found"})
		return
	}

	var input entity.RolePermission
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Model(&rolePermission).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rolePermission)
}

// DELETE /rolepermissions/:id
func DeleteRolePermission(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM role_permissions WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "role_permission not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
