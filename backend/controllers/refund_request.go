package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /refunds
func CreateRefundRequest(c *gin.Context) {
	var payload struct {
		OrderID uint    `json:"order_id"`
		UserID  uint    `json:"user_id"`
		Reason  string  `json:"reason"`
		Amount  float64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
		return
	}

	db := configs.DB()
	var pending entity.RefundStatus
	if err := db.Where("status_name = ?", "Pending").First(&pending).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pending status not found"})
		return
	}

	req := entity.RefundRequest{
		OrderID:        payload.OrderID,
		UserID:         payload.UserID,
		Reason:         payload.Reason,
		Amount:         payload.Amount,
		RequestDate:    time.Now(),
		RefundStatusID: pending.ID,
	}
	if err := db.Create(&req).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

// GET /refunds
func FindRefundRequests(c *gin.Context) {
	var refunds []entity.RefundRequest
	db := configs.DB()
	tx := db.Preload("Attachments").Preload("RefundStatus")
	if uid := c.Query("user_id"); uid != "" {
		tx = tx.Where("user_id = ?", uid)
	}
	if err := tx.Find(&refunds).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, refunds)
}

// GET /refunds/:id
func FindRefundRequestByID(c *gin.Context) {
	var refund entity.RefundRequest
	if tx := configs.DB().Preload("Attachments").Preload("RefundStatus").First(&refund, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, refund)
}

// PATCH /refunds/:id/status
func UpdateRefundRequestStatus(c *gin.Context) {
	var payload struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || payload.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	db := configs.DB()
	var refund entity.RefundRequest
	if tx := db.First(&refund, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}

	var status entity.RefundStatus
	if err := db.Where("status_name = ?", payload.Status).First(&status).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status not found"})
		return
	}

	updates := map[string]interface{}{
		"refund_status_id": status.ID,
		"processed_date":   time.Now(),
	}
	if err := db.Model(&refund).Updates(updates).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}
