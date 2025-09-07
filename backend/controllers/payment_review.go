package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
    "example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func CreatePaymentReview(c *gin.Context) {
	var body entity.PaymentReview
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	// ตรวจ User (ผู้ตรวจ)
	var user entity.User
	if tx := configs.DB().First(&user, body.UserID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id not found"})
		return
	}
	if body.VerifiedAt.IsZero() {
		body.VerifiedAt = time.Now()
	}
	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

func FindPaymentReviews(c *gin.Context) {
	var rows []entity.PaymentReview
	db := configs.DB().Preload("User")
	userID := c.Query("user_id")
	if userID != "" {
		db = db.Where("user_id = ?", userID)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func DeletePaymentReview(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM payment_reviews WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
