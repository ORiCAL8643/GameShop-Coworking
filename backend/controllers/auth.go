// controllers/auth.go
package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email"` // optional
}

var usernameRe = regexp.MustCompile(`^[a-zA-Z0-9_.-]{3,32}$`)

// POST /login
func Login(c *gin.Context) {
	var body LoginRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body", "detail": err.Error()})
		return
	}

	var user entity.User
	if err := configs.DB().
		Preload("Role.RolePermissions.Permission").
		Where("username = ?", body.Username).
		First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	// entity.User ใช้ Password เก็บ bcrypt hash
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret"
	}
	exp := time.Now().Add(72 * time.Hour).Unix()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": exp,
	})
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
		return
	}

	perms := make([]string, 0, len(user.Role.RolePermissions))
	for _, rp := range user.Role.RolePermissions {
		if rp.Permission != nil {
			perms = append(perms, rp.Permission.Key)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "login successful",
		"id":          user.ID,
		"username":    user.Username,
		"role":        user.Role.Title,
		"permissions": perms,
		"token":       tokenString,
		"exp":         exp,
	})
}

// POST /register (เปิดตลอด)
func Register(c *gin.Context) {
	var body RegisterRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body", "detail": err.Error()})
		return
	}

	username := strings.TrimSpace(body.Username)
	email := strings.ToLower(strings.TrimSpace(body.Email))

	// 1) validate
	if !usernameRe.MatchString(username) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username format (3-32 chars; letters, digits, _, ., -)"})
		return
	}
	if len(body.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password too short (min 6)"})
		return
	}

	// 2) กันซ้ำ
	var cnt int64
	if err := configs.DB().Model(&entity.User{}).Where("username = ?", username).Count(&cnt).Error; err == nil && cnt > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username already taken"})
		return
	}
	if email != "" {
		cnt = 0
		if err := configs.DB().Model(&entity.User{}).Where("email = ?", email).Count(&cnt).Error; err == nil && cnt > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email already in use"})
			return
		}
	}

	// 3) hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	// 4) role เริ่มต้น (ต้องมาจาก SetupDatabase)
	roleID := configs.UserRoleID()
	if roleID == 0 {
		// safety net: หา role "User" จาก DB
		type row struct{ ID uint }
		var r row
		if err := configs.DB().Raw(`SELECT id FROM roles WHERE title = ? LIMIT 1`, "User").Scan(&r).Error; err == nil && r.ID != 0 {
			roleID = r.ID
		}
		if roleID == 0 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "system not initialized (User role missing)"})
			return
		}
	}

	// 5) ถ้า email ว่าง ให้ตั้ง placeholder ไม่ชน uniqueIndex
	if email == "" {
		// ใช้ username เป็น local-part → ไม่ซ้ำ (เพราะ username unique)
		email = fmt.Sprintf("%s@placeholder.local", username)
	}

	// 6) สร้างผู้ใช้
	u := entity.User{
		Username: username,
		Password: string(hash), // bcrypt hash
		Email:    email,
		RoleID:   roleID,
	}
	if err := configs.DB().Create(&u).Error; err != nil {
		msg := err.Error()
		// แปล error ที่พบบ่อยให้อ่านง่าย
		lmsg := strings.ToLower(msg)
		switch {
		case strings.Contains(lmsg, "username") && strings.Contains(lmsg, "unique"):
			c.JSON(http.StatusBadRequest, gin.H{"error": "username already taken"})
			return
		case strings.Contains(lmsg, "email") && strings.Contains(lmsg, "unique"):
			c.JSON(http.StatusBadRequest, gin.H{"error": "email already in use"})
			return
		case strings.Contains(lmsg, "foreign key") && strings.Contains(lmsg, "role"):
			c.JSON(http.StatusBadRequest, gin.H{"error": "role not found; system not initialized"})
			return
		}
		if errors.Is(err, gorm.ErrInvalidData) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid data"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to create user", "detail": msg})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": u.ID})
}
