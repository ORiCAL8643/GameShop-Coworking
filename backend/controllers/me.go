package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GetMyPermissions returns current user's roles and permissions.
func GetMyPermissions(c *gin.Context) {
	uidAny, _ := c.Get("userID")
	uid, _ := uidAny.(uint)

	var user entity.User
	if err := configs.DB().Preload("Role").Select("id, role_id").First(&user, uid).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	roles := []string{}
	if user.Role.ID != 0 {
		roles = append(roles, user.Role.Title)
	}

	var perms []string
	configs.DB().Model(&entity.Permission{}).
		Select("permissions.key").
		Joins("JOIN role_permissions rp ON rp.permission_id = permissions.id").
		Where("rp.role_id = ?", user.RoleID).
		Pluck("permissions.key", &perms)

	c.JSON(http.StatusOK, gin.H{"roles": roles, "perms": perms})
}
