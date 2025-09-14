package controllers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// POST /login
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
	if tx := configs.DB().Where("username = ?", body.Username).First(&user); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "incorrect password"})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret" // ต้องตรงกับมิดเดิลแวร์เดิมของคุณ
	}

	expAt := time.Now().Add(72 * time.Hour)

	// ✅ ออก claims ให้เข้ากับ AuthRequired() เดิม
	claims := jwt.MapClaims{
		"sub":     fmt.Sprintf("%d", user.ID), // ต้องเป็น string
		"user_id": user.ID,                    // สำรองให้มิดเดิลแวร์อ่านได้ทั้งเลข/สตริง
		"role_id": user.RoleID,                // เผื่อใช้งานต่อ
		"iat":     time.Now().Unix(),
		"exp":     expAt.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "login successful",
		"id":       user.ID,
		"username": user.Username,
		"token":    tokenString,
		"exp":      expAt.Unix(),
	})
}
