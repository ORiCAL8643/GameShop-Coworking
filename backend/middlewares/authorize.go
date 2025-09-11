package middlewares

import (
	"net/http"
	"os"
	"strings"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Authorize(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		tokenString := strings.TrimPrefix(auth, "Bearer ")
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "secret"
		}
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		uid, ok := claims["sub"].(float64)
		if !ok {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		var user entity.User
		if tx := configs.DB().Preload("Role").First(&user, uint(uid)); tx.Error != nil {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		var perms []string
		configs.DB().Table("permissions").
			Select("permissions.key").
			Joins("join role_permissions on role_permissions.permission_id = permissions.id").
			Where("role_permissions.role_id = ?", user.RoleID).
			Pluck("permissions.key", &perms)
		allowed := false
		for _, p := range perms {
			if p == permission {
				allowed = true
				break
			}
		}
		if !allowed {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}
		c.Set("user", user)
		c.Set("permissions", perms)
		c.Next()
	}
}
