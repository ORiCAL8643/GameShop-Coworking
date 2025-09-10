package controllers

import (
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
	uid, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if body.UserID != 0 && body.UserID != uid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user_id mismatch"})
		return
	}
	body.UserID = uid
	// ตรวจ User
	var user entity.User
	if tx := configs.DB().First(&user, body.UserID); tx.RowsAffected == 0 {
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
	uid, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var rows []entity.Order
	db := configs.DB().Preload("User").Preload("OrderItems").Preload("Payments").Preload("OrderPromotions")

	var user entity.User
	if err := configs.DB().First(&user, uid).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	if user.RoleID != 3 {
		db = db.Where("user_id = ?", uid)
	}

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
