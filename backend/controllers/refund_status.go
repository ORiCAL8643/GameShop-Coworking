package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /refund-statuses
func CreateRefundStatus(c *gin.Context) {
	var body entity.RefundStatus
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

// GET /refund-statuses
func FindRefundStatuses(c *gin.Context) {
	var statuses []entity.RefundStatus
	db := configs.DB()

	// ถ้าต้องการ filter สามารถใช้ query string เช่น ?status_name=...
	statusName := c.Query("status_name")

	tx := db.Model(&entity.RefundStatus{}).Preload("RefundRequests")
	if statusName != "" {
		tx = tx.Where("status_name = ?", statusName)
	}

	if err := tx.Find(&statuses).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, statuses)
}

// GET /refund-statuses/:id
func FindRefundStatusByID(c *gin.Context) {
	var status entity.RefundStatus
	if tx := configs.DB().Preload("RefundRequests").First(&status, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, status)
}

// PUT /refund-statuses/:id
func UpdateRefundStatus(c *gin.Context) {
	var payload entity.RefundStatus
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var status entity.RefundStatus
	db := configs.DB()
	if tx := db.First(&status, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	// อัปเดตเฉพาะ StatusName (ถ้าไม่อยากให้อัปเดต RefundRequests โดยตรง)
	if err := db.Model(&status).Updates(entity.RefundStatus{StatusName: payload.StatusName}).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

// DELETE /refund-statuses/:id
func DeleteRefundStatusByID(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM refund_statuses WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
