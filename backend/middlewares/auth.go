// backend/middlewares/auth.go
package middlewares

import (
	"net/http"
	"os"
	"strconv"
	"strings"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID uint `json:"user_id"`
	RoleID uint `json:"role_id"`
	jwt.RegisteredClaims
}

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dev-secret"
		}

		token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims := token.Claims.(*Claims)
		uid := claims.UserID
		// fallback: ใช้ sub ถ้าฝั่ง login เซ็น sub=uid
		if uid == 0 && claims.Subject != "" {
			if n, err := strconv.Atoi(claims.Subject); err == nil {
				uid = uint(n)
			}
		}
		if uid == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "no user id in token"})
			return
		}
		c.Set("userID", uid)
		roleID := claims.RoleID
		if roleID == 0 {
			var u entity.User
			if err := configs.DB().Select("role_id").First(&u, uid).Error; err == nil {
				roleID = u.RoleID
			}
		}
		if roleID > 0 {
			c.Set("roleID", roleID)
		}
		c.Next()
	}
}

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleIDAny, _ := c.Get("roleID")
		roleID, _ := roleIDAny.(uint)
		if roleID == 0 {
			uid := c.MustGet("userID").(uint)
			var u entity.User
			if err := configs.DB().First(&u, uid).Error; err == nil {
				roleID = u.RoleID
				c.Set("roleID", roleID)
			}
		}
		if roleID != configs.AdminRoleID() {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin only"})
			return
		}
		c.Next()
	}
}
