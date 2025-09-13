package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /threads/:id/comments
type createCommentBody struct {
	Content string `json:"content" binding:"required"`
}

func CreateComment(c *gin.Context) {
	uid := c.GetUint("userID")
	if uid == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
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

	row := entity.Comment{
		Content:  strings.TrimSpace(body.Content),
		ThreadID: th.ID,
		UserID:   uid,
	}
	if err := db.Create(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// เพิ่มตัวนับ comment
	db.Model(&entity.Thread{}).Where("id = ?", th.ID).
		UpdateColumn("comment_count", gorm.Expr("comment_count + 1"))

	_ = db.Preload("User").First(&row, row.ID)
	c.JSON(http.StatusCreated, row)
}

// GET /threads/:id/comments?limit=&offset=
func FindCommentsByThread(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "200"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var rows []entity.Comment
	if err := configs.DB().Preload("User").
		Where("thread_id = ?", c.Param("id")).
		Order("id ASC"). // เรียงเป็นแถวเดียว
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
	db.Model(&entity.Thread{}).Where("id = ?", row.ThreadID).
		UpdateColumn("comment_count", gorm.Expr("CASE WHEN comment_count > 0 THEN comment_count - 1 ELSE 0 END"))
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
