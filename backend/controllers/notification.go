package controllers

import (
	"log"
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /notifications
func CreateNotification(c *gin.Context) {
	var body entity.Notification
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
		return
	}

	// ตรวจสอบว่ามี user_id นี้จริงไหม
	var user entity.User
	if tx := configs.DB().Where("id = ?", body.UserID).First(&user); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id not found"})
		return
	}

	// default type ถ้าไม่ส่งมา
	if body.Type == "" {
		body.Type = "system"
	}
	// เริ่มต้นให้ยังไม่อ่าน
	body.IsRead = false

	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("📥 CreateNotification: user_id=%d title=%q message=%q type=%q",
		body.UserID, body.Title, body.Message, body.Type)

	c.JSON(http.StatusCreated, body)
}

// GET /notifications?user_id=...
func FindNotifications(c *gin.Context) {
	uid := c.Query("user_id")
	if uid == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "must provide user_id"})
		return
	}

	var rows []entity.Notification
	if err := configs.DB().
		Preload("User").
		Where("user_id = ?", uid).
		Order("created_at DESC").
		Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	log.Printf("📤 FindNotifications: user_id=%s count=%d", uid, len(rows))
	c.JSON(http.StatusOK, rows)
}

// GET /notifications/:id
func FindNotificationByID(c *gin.Context) {
	var row entity.Notification
	if tx := configs.DB().Preload("User").First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}
	c.JSON(http.StatusOK, row)
}

// PUT /notifications/:id/read → อ่านแล้ว (เดี่ยว)
func MarkNotificationRead(c *gin.Context) {
	id := c.Param("id")
	db := configs.DB()

	if err := db.Model(&entity.Notification{}).
		Where("id = ?", id).
		Update("is_read", true).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var row entity.Notification
	_ = db.First(&row, id)
	c.JSON(http.StatusOK, row)
}

// PUT /notifications/read-all → อ่านแล้วทั้งหมด
func MarkAllNotificationsRead(c *gin.Context) {
	var body struct {
		UserID uint `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "must provide user_id"})
		return
	}

	db := configs.DB()
	if err := db.Model(&entity.Notification{}).
		Where("user_id = ? AND is_read = ?", body.UserID, false).
		Update("is_read", true).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "marked all as read"})
}

// DELETE /notifications/:id
func DeleteNotificationByID(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM notifications WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
