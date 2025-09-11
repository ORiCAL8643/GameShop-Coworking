package controllers

import (
	"net/http"
	"os"
	"strings"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Me(c *gin.Context) {
	auth := c.GetHeader("Authorization")
	if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
		c.JSON(http.StatusOK, gin.H{"id": 0, "permissions": []string{}})
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
		c.JSON(http.StatusOK, gin.H{"id": 0, "permissions": []string{}})
		return
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusOK, gin.H{"id": 0, "permissions": []string{}})
		return
	}
	uid, ok := claims["sub"].(float64)
	if !ok {
		c.JSON(http.StatusOK, gin.H{"id": 0, "permissions": []string{}})
		return
	}
	var user entity.User
	if tx := configs.DB().Preload("Role").First(&user, uint(uid)); tx.Error != nil {
		c.JSON(http.StatusOK, gin.H{"id": 0, "permissions": []string{}})
		return
	}
	var perms []string
	configs.DB().Table("permissions").
		Select("permissions.key").
		Joins("join role_permissions on role_permissions.permission_id = permissions.id").
		Where("role_permissions.role_id = ?", user.RoleID).
		Pluck("permissions.key", &perms)

	c.JSON(http.StatusOK, gin.H{
		"id":          user.ID,
		"username":    user.Username,
		"email":       user.Email,
		"role":        gin.H{"id": user.Role.ID, "title": user.Role.Title},
		"permissions": perms,
	})
}
