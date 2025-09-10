package controllers

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func CreateOrder(c *gin.Context) {
	user, err := authorize(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	var body entity.Order
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	body.UserID = user.ID
	if body.OrderCreate.IsZero() {
		body.OrderCreate = time.Now()
	}
	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

func FindOrders(c *gin.Context) {
	user, err := authorize(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	var rows []entity.Order
	db := configs.DB().Preload("User").Preload("OrderItems").Preload("Payments").Preload("OrderPromotions")
	status := c.Query("status")
	if user.RoleID == 3 {
		userID := c.Query("user_id")
		if userID != "" {
			db = db.Where("user_id = ?", userID)
		}
	} else {
		db = db.Where("user_id = ?", user.ID)
	}
	if status != "" {
		db = db.Where("order_status = ?", status)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func FindOrderByID(c *gin.Context) {
	user, err := authorize(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	var row entity.Order
	if tx := configs.DB().
		Preload("User").
		Preload("OrderItems.KeyGame.Game").
		Preload("Payments.PaymentSlips").
		Preload("OrderPromotions.Promotion").
		First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	if user.RoleID != 3 && row.UserID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	c.JSON(http.StatusOK, row)
}

func UpdateOrder(c *gin.Context) {
	user, err := authorize(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	var payload entity.Order
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var row entity.Order
	db := configs.DB()
	if tx := db.First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	if user.RoleID != 3 && row.UserID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	if err := db.Model(&row).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

func DeleteOrder(c *gin.Context) {
	user, err := authorize(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	var row entity.Order
	db := configs.DB()
	if tx := db.First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	if user.RoleID != 3 && row.UserID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	if err := db.Delete(&row).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}

func authorize(c *gin.Context) (*entity.User, error) {
	header := c.GetHeader("Authorization")
	if header == "" {
		return nil, errors.New("authorization header missing")
	}
	tokenString := strings.TrimPrefix(header, "Bearer ")
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret"
	}
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}
	sub, ok := claims["sub"].(float64)
	if !ok {
		return nil, errors.New("invalid subject")
	}
	var user entity.User
	if tx := configs.DB().First(&user, uint(sub)); tx.RowsAffected == 0 {
		return nil, errors.New("user not found")
	}
	return &user, nil
}
