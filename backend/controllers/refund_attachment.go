package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /refund-attachments
func CreateRefundAttachment(c *gin.Context) {
	var body entity.RefundAttachment
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

// GET /refund-attachments
// optional: ?refund_id=...
func FindRefundAttachments(c *gin.Context) {
	var attachments []entity.RefundAttachment
	db := configs.DB()

	refundID := c.Query("refund_id")
	tx := db.Model(&entity.RefundAttachment{})
	if refundID != "" {
		tx = tx.Where("refund_id = ?", refundID)
	}
	if err := tx.Find(&attachments).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, attachments)
}

// GET /refund-attachments/:id
func FindRefundAttachmentByID(c *gin.Context) {
	var attachment entity.RefundAttachment
	if tx := configs.DB().First(&attachment, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, attachment)
}

// PUT /refund-attachments/:id
func UpdateRefundAttachment(c *gin.Context) {
	var payload entity.RefundAttachment
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var attachment entity.RefundAttachment
	db := configs.DB()
	if tx := db.First(&attachment, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	if err := db.Model(&attachment).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

// DELETE /refund-attachments/:id
func DeleteRefundAttachmentByID(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM refund_attachments WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
