package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /threads/:id/comments
type createCommentBody struct {
	UserID  *uint  `json:"user_id"` // optional
	Content string `json:"content" binding:"required"`
}
func CreateComment(c *gin.Context) {
	var body createCommentBody
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Content) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content required"})
		return
	}

	db := configs.DB()
	var th entity.Thread
	if tx := db.First(&th, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
		return
	}

	// ถ้ามี user_id -> เช็คว่ามีจริง (optional)
	if body.UserID != nil && *body.UserID > 0 {
		var u entity.User
		if tx := db.First(&u, *body.UserID); tx.RowsAffected == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user_id not found"})
			return
		}
	}

	row := entity.Comment{
		Content:  strings.TrimSpace(body.Content),
		ThreadID: th.ID,
		UserID:   body.UserID,
	}
	if err := db.Create(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// เพิ่มตัวนับคอมเมนต์
	_ = db.Model(&entity.Thread{}).Where("id = ?", th.ID).Update("comment_count", th.CommentCount+1).Error

	_ = db.Preload("User").Preload("Thread").First(&row, row.ID)
	c.JSON(http.StatusCreated, row)
}

// GET /threads/:id/comments?limit=&offset=
func FindCommentsByThread(c *gin.Context) {
	var th entity.Thread
	if tx := configs.DB().First(&th, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var rows []entity.Comment
	if err := configs.DB().
		Preload("User").
		Where("thread_id = ?", th.ID).
		Order("id ASC"). // เรียงบนลงล่าง
		Limit(limit).Offset(offset).
		Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// DELETE /comments/:id
func DeleteComment(c *gin.Context) {
	db := configs.DB()

	var row entity.Comment
	if tx := db.First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	if err := db.Delete(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// ลดตัวนับคอมเมนต์
	_ = db.Model(&entity.Thread{}).
		Where("id = ?", row.ThreadID).
		Update("comment_count", gormExprDecrement("comment_count", 1)).Error

	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
