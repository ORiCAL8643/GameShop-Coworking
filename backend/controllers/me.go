package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"example.com/sa-gameshop/services"
	"github.com/gin-gonic/gin"
)

func Me(ps *services.PermService) gin.HandlerFunc {
	return func(c *gin.Context) {
		uidAny, _ := c.Get("userID")
		roleAny, _ := c.Get("roleID")
		uid, _ := uidAny.(uint)
		roleID, _ := roleAny.(uint)

		var u entity.User
		if err := configs.DB().Preload("Role").First(&u, uid).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
			return
		}
		set, err := ps.GetByRole(roleID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "perm lookup failed"})
			return
		}
		perms := make([]string, 0, len(set))
		for p := range set {
			perms = append(perms, p)
		}
		c.JSON(http.StatusOK, gin.H{
			"id":    u.ID,
			"email": u.Email,
			"role": gin.H{
				"id":   u.Role.ID,
				"name": u.Role.Title,
			},
			"permissions": perms,
		})
	}
}
