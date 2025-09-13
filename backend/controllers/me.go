package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GET /me/permissions
func GetMyPermissions(c *gin.Context) {
	uidAny, _ := c.Get("userID")
	uid, _ := uidAny.(uint)
	var u entity.User
	db := configs.DB()
	if err := db.Preload("Role").First(&u, uid).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}
	var perms []string
	db.Table("permissions").
		Select("permissions.key").
		Joins("JOIN role_permissions rp ON rp.permission_id = permissions.id").
		Where("rp.role_id = ?", u.RoleID).
		Pluck("permissions.key", &perms)
	roles := []string{}
	if u.Role.ID != 0 {
		roles = append(roles, u.Role.Title)
	}
	c.JSON(http.StatusOK, gin.H{"roles": roles, "perms": perms})
}
