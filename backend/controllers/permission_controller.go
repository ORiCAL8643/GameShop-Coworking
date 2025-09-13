package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"example.com/sa-gameshop/services"
	"github.com/gin-gonic/gin"
)

func ListPermissions(c *gin.Context) {
	var perms []entity.Permission
	if err := configs.DB().Find(&perms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, perms)
}

func CreatePermission(c *gin.Context) {
	var p entity.Permission
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Create(&p).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func DeletePermission(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Delete(&entity.Permission{}, id); tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": tx.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func GrantPermToRole(ps *services.PermService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			PermissionCode string `json:"permission_code"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		roleIDAny := c.Param("roleId")
		var role entity.Role
		if err := configs.DB().First(&role, roleIDAny).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
			return
		}
		var perm entity.Permission
		if err := configs.DB().Where("code = ?", body.PermissionCode).First(&perm).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "permission not found"})
			return
		}
		rp := entity.RolePermission{RoleID: role.ID, PermissionID: perm.ID}
		if err := configs.DB().FirstOrCreate(&rp, rp).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ps.Invalidate(role.ID)
		c.JSON(http.StatusOK, gin.H{"message": "granted"})
	}
}

func RevokePermFromRole(ps *services.PermService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			PermissionCode string `json:"permission_code"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		roleIDAny := c.Param("roleId")
		var role entity.Role
		if err := configs.DB().First(&role, roleIDAny).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "role not found"})
			return
		}
		var perm entity.Permission
		if err := configs.DB().Where("code = ?", body.PermissionCode).First(&perm).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "permission not found"})
			return
		}
		if err := configs.DB().Where("role_id = ? AND permission_id = ?", role.ID, perm.ID).Delete(&entity.RolePermission{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ps.Invalidate(role.ID)
		c.JSON(http.StatusOK, gin.H{"message": "revoked"})
	}
}
