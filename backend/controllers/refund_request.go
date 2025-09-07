package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /refund-requests
func CreateRefundRequest(c *gin.Context) {
	var body entity.RefundRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
		return
	}

	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

// GET /refund-requests
// optional: ?user_id=... / ?refund_status_id=...
func FindRefundRequests(c *gin.Context) {
	var requests []entity.RefundRequest
	db := configs.DB()

	userID := c.Query("user_id")
	statusID := c.Query("refund_status_id")

	tx := db.Model(&entity.RefundRequest{}).Preload("Attachments")
	if userID != "" {
		tx = tx.Where("user_id = ?", userID)
	}
	if statusID != "" {
		tx = tx.Where("refund_status_id = ?", statusID)
	}

	if err := tx.Find(&requests).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, requests)
}

// GET /refund-requests/:id
func FindRefundRequestByID(c *gin.Context) {
	var request entity.RefundRequest
	if tx := configs.DB().Preload("Attachments").First(&request, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, request)
}

// PUT /refund-requests/:id
func UpdateRefundRequest(c *gin.Context) {
	var payload entity.RefundRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var request entity.RefundRequest
	db := configs.DB()
	if tx := db.First(&request, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	if err := db.Model(&request).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

// DELETE /refund-requests/:id
func DeleteRefundRequestByID(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM refund_requests WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
