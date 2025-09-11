package controllers

import (
	"net/http"
	"os"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Login handles user authentication and JWT generation
func Login(c *gin.Context) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
		return
	}

	var user entity.User
	if tx := configs.DB().Preload("Role.RolePermissions.Permission").Where("username = ?", body.Username).First(&user); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "incorrect password"})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret"
	}

	exp := time.Now().Add(72 * time.Hour).Unix()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(72 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
		return
	}

	perms := []string{}
	for _, rp := range user.Role.RolePermissions {
		if rp.Permission != nil {
			perms = append(perms, rp.Permission.Key)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "login successful",
		"id":          user.ID,
		"username":    user.Username,
		"token":       tokenString,
		"exp":         exp,
		"permissions": perms,
		"role":        user.Role.Title,
	})
}
