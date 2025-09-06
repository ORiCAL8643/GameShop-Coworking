package controllers

import (
	"net/http"

	"gameshop-backend/configs"
	"gameshop-backend/entity/role"
	"github.com/gin-gonic/gin"
)

// GET /roles
func GetRoles(c *gin.Context) {
	var roles []entity.Role
	if err := configs.DB().Find(&roles).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, roles)
}

// GET /roles/:id
func GetRoleById(c *gin.Context) {
	id := c.Param("id")
	var role entity.Role
	if tx := configs.DB().Where("id = ?", id).First(&role); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
		return
	}
	c.JSON(http.StatusOK, role)
}

// POST /roles
func CreateRole(c *gin.Context) {
	var role entity.Role
	if err := c.ShouldBindJSON(&role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, role)
}

// PATCH /roles/:id
func UpdateRole(c *gin.Context) {
	id := c.Param("id")
	var role entity.Role
	if tx := configs.DB().Where("id = ?", id).First(&role); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
		return
	}

	var input entity.Role
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Model(&role).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, role)
}

// DELETE /roles/:id
func DeleteRole(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM roles WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
