package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
    "example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func CreatePaymentSlip(c *gin.Context) {
	var body entity.PaymentSlip
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	var pm entity.Payment
	if tx := configs.DB().First(&pm, body.PaymentID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment_id not found"})
		return
	}
	if body.UploadAt.IsZero() {
		body.UploadAt = time.Now()
	}
	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

func FindPaymentSlips(c *gin.Context) {
	var rows []entity.PaymentSlip
	db := configs.DB().Preload("Payment")
	paymentID := c.Query("payment_id")
	if paymentID != "" {
		db = db.Where("payment_id = ?", paymentID)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func DeletePaymentSlip(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM payment_slips WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
