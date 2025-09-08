package controllers

import (
	"fmt"
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func CreateOrder(c *gin.Context) {
	var body entity.Order
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	// ดึง user id จาก token
	user, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid := user.(uint)
	body.UserID = uid

	// ตรวจ User
	var u entity.User
	if tx := configs.DB().First(&u, uid); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id not found"})
		return
	}
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
	user, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := user.(uint)
	if q := c.Query("user_id"); q != "" && q != fmt.Sprint(userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	var rows []entity.Order
	db := configs.DB().Preload("User").Preload("OrderItems").Preload("Payments").Preload("OrderPromotions").Where("user_id = ?", userID)
	status := c.Query("status")
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
	user, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid := user.(uint)
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
	if row.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	c.JSON(http.StatusOK, row)
}

func UpdateOrder(c *gin.Context) {
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
	if err := db.Model(&row).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

func DeleteOrder(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM orders WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
