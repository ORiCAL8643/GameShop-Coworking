package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// POST /threads/:id/toggle_like
type toggleLikeBody struct {
	UserID uint `json:"user_id" binding:"required"`
}

func ToggleThreadLike(c *gin.Context) {
	var body toggleLikeBody
	if err := c.ShouldBindJSON(&body); err != nil || body.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}

	db := configs.DB()
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// โหลดเธรด (ล็อกแถวไว้ถ้าดาต้าเบสรองรับ)
	var th entity.Thread
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&th, c.Param("id")).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
		return
	}

	// เคยไลก์หรือยัง?
	var existing entity.ThreadLike
	err := tx.Where("thread_id = ? AND user_id = ?", th.ID, body.UserID).First(&existing).Error
	switch err {
	case nil:
		// 👉 เคยไลก์แล้ว -> ยกเลิกไลก์ และลดตัวนับ (ไม่ให้ติดลบ)
		if err := tx.Delete(&existing).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := tx.Model(&entity.Thread{}).
			Where("id = ?", th.ID).
			Update("like_count", gormExprDecrement("like_count", 1)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		tx.Commit()
		c.JSON(http.StatusOK, gin.H{"liked": false})
	case gorm.ErrRecordNotFound:
		// 👉 ยังไม่เคยไลก์ -> สร้าง และเพิ่มตัวนับ
		if err := tx.Create(&entity.ThreadLike{ThreadID: th.ID, UserID: body.UserID}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := tx.Model(&entity.Thread{}).
			Where("id = ?", th.ID).
			Update("like_count", gormExprIncrement("like_count", 1)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		tx.Commit()
		c.JSON(http.StatusOK, gin.H{"liked": true})
	default:
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}

// ===== helpers =====

// NOTE: return type ต้องเป็น clause.Expr (ไม่ใช่ gorm.Expr)
func gormExprIncrement(col string, n int) clause.Expr {
	return gorm.Expr(col+" + ?", n)
}
func gormExprDecrement(col string, n int) clause.Expr {
	return gorm.Expr("CASE WHEN "+col+" >= ? THEN "+col+" - ? ELSE 0 END", n, n)
}
