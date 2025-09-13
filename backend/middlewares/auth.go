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
		c.Set("roleID", claims.RoleID)
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

// hasPerm คืน true หาก role นั้นมีสิทธิ need หรือ admin:all
func hasPerm(perms map[string]struct{}, need string) bool {
	if _, ok := perms["admin:all"]; ok {
		return true
	}
	_, ok := perms[need]
	return ok
}

// loadPerms: โหลดสิทธิทั้งหมดของ role จาก role_permissions → permissions
func loadPerms(roleID uint) map[string]struct{} {
	out := make(map[string]struct{})
	if roleID == 0 {
		return out
	}
	var keys []string
	configs.DB().Table("permissions").
		Select("permissions.key").
		Joins("JOIN role_permissions rp ON rp.permission_id = permissions.id").
		Where("rp.role_id = ?", roleID).
		Pluck("permissions.key", &keys)
	for _, k := range keys {
		out[k] = struct{}{}
	}
	return out
}

// RequireAdminPerm ตรวจทั้ง admin:panel และ need (หรือ admin:all)
func RequireAdminPerm(need string) gin.HandlerFunc {
	return func(c *gin.Context) {
		uidAny, _ := c.Get("userID")
		roleIDAny, _ := c.Get("roleID")
		roleID, _ := roleIDAny.(uint)
		if roleID == 0 {
			if uid, ok := uidAny.(uint); ok && uid > 0 {
				var u entity.User
				if err := configs.DB().Select("role_id").First(&u, uid).Error; err == nil {
					roleID = u.RoleID
					c.Set("roleID", roleID)
				}
			}
		}
		perms := loadPerms(roleID)
		if !hasPerm(perms, "admin:panel") || !hasPerm(perms, need) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}
