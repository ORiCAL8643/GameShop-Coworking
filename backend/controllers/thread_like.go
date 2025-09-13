package controllers

import (
	"errors"
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /threads/:id/toggle_like
func ToggleThreadLike(c *gin.Context) {
	uid := c.GetUint("userID")
	if uid == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var th entity.Thread
	if err := configs.DB().First(&th, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
		return
	}

	db := configs.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			db.Rollback()
		}
	}()

	var like entity.ThreadLike
	err := db.Where("thread_id = ? AND user_id = ?", th.ID, uid).First(&like).Error
	switch {
	case err == nil:
		// ยกเลิกไลก์
		if err := db.Unscoped().Delete(&like).Error; err != nil {
			db.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		db.Model(&entity.Thread{}).Where("id = ?", th.ID).
			UpdateColumn("like_count", gorm.Expr("CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END"))
		db.Commit()
		c.JSON(http.StatusOK, gin.H{"liked": false})
		return

	case errors.Is(err, gorm.ErrRecordNotFound):
		// เพิ่มไลก์
		if err := db.Create(&entity.ThreadLike{ThreadID: th.ID, UserID: uid}).Error; err != nil {
			db.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		db.Model(&entity.Thread{}).Where("id = ?", th.ID).
			UpdateColumn("like_count", gorm.Expr("like_count + 1"))
		db.Commit()
		c.JSON(http.StatusOK, gin.H{"liked": true})
		return

	default:
		db.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}
