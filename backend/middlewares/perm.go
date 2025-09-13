package middlewares

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// RequirePerm checks that current user's role has at least one of the given permissions.
// It reads userID and roleID from context (set by AuthRequired). If roleID is missing
// it will fetch from the database. Permissions are looked up fresh from DB each request
// to ensure changes take effect immediately.
func RequirePerm(perms ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		uidAny, ok := c.Get("userID")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}

		roleID := uint(0)
		if v, ok := c.Get("roleID"); ok {
			switch x := v.(type) {
			case uint:
				roleID = x
			case *uint:
				if x != nil {
					roleID = *x
				}
			}
		}
		if roleID == 0 {
			if uid, ok := uidAny.(uint); ok {
				var u entity.User
				if err := configs.DB().Select("role_id").First(&u, uid).Error; err == nil {
					roleID = u.RoleID
					c.Set("roleID", roleID)
				}
			}
		}

		if roleID == 0 {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}

		var keys []string
		configs.DB().Model(&entity.Permission{}).
			Select("permissions.key").
			Joins("JOIN role_permissions rp ON rp.permission_id = permissions.id").
			Where("rp.role_id = ?", roleID).
			Pluck("permissions.key", &keys)

		allowed := false
		permSet := map[string]bool{}
		for _, k := range keys {
			permSet[k] = true
			if k == "*" {
				allowed = true
			}
		}
		if !allowed {
			for _, need := range perms {
				if permSet[need] {
					allowed = true
					break
				}
			}
		}
		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "permission denied"})
			return
		}
		c.Next()
	}
}
