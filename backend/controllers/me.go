package controllers

import (
	"net/http"

	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// Me returns current user info and permissions
func Me(c *gin.Context) {
	u, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	user := u.(entity.User)

	perms := []string{}
	for _, rp := range user.Role.RolePermissions {
		if rp.Permission != nil {
			perms = append(perms, rp.Permission.Key)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
		"role": gin.H{
			"id":    user.RoleID,
			"title": user.Role.Title,
		},
		"permissions": perms,
	})
}
