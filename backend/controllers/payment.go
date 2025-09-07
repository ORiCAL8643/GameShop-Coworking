package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
    "example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func CreatePayment(c *gin.Context) {
	var body entity.Payment
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	// ตรวจ Order
	var od entity.Order
	if tx := configs.DB().First(&od, body.OrderID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id not found"})
		return
	}
	if body.PaymentDate.IsZero() {
		body.PaymentDate = time.Now()
	}
	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

func FindPayments(c *gin.Context) {
	var rows []entity.Payment
	db := configs.DB().Preload("Order").Preload("PaymentSlips")
	orderID := c.Query("order_id")
	status := c.Query("status")
	if orderID != "" {
		db = db.Where("order_id = ?", orderID)
	}
	if status != "" {
		db = db.Where("status = ?", status)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func UpdatePayment(c *gin.Context) {
	var payload entity.Payment
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := configs.DB()
	var row entity.Payment
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

func DeletePayment(c *gin.Context) {
	// ลบสลิปที่เกี่ยวข้องก่อน
	db := configs.DB()
	db.Exec("DELETE FROM payment_slips WHERE payment_id = ?", c.Param("id"))
	if tx := db.Exec("DELETE FROM payments WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
