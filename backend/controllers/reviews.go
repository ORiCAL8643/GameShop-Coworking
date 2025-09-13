package controllers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
)

// ---- DTO ----

type reviewCreateDTO struct {
	GameID      uint   `json:"game_id" binding:"required"`
	UserID      uint   `json:"user_id" binding:"required"`
	ReviewTitle string `json:"review_title"`
	ReviewText  string `json:"review_text" binding:"required"`
	Rating      int    `json:"rating" binding:"required"`
}

type reviewUpdateDTO struct {
	ReviewTitle *string `json:"review_title"`
	ReviewText  *string `json:"review_text"`
	Rating      *int    `json:"rating"`
}

// ---- Helpers ----

func clampRating(n int) int {
	if n < 1 {
		return 1
	}
	if n > 5 {
		return 5
	}
	return n
}

// ---- Handlers ----

// POST /reviews
func CreateReview(c *gin.Context) {
	var in reviewCreateDTO
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	in.Rating = clampRating(in.Rating)

	db := configs.DB()

	// กันซ้ำแบบเร็ว (ก่อนชน unique)
	var exists entity.Review
	if err := db.Where("user_id = ? AND game_id = ?", in.UserID, in.GameID).First(&exists).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "already_reviewed",
			"message": "คุณได้รีวิวเกมนี้แล้ว กรุณาแก้ไขรีวิวเดิม",
		})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบว่าเป็นเจ้าของเกมหรือไม่
	var ug entity.UserGame
	if err := db.Where("user_id = ? AND game_id = ?", in.UserID, in.GameID).First(&ug).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, gin.H{"error": "not_owned"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	r := entity.Review{
		GameID:      in.GameID,
		UserID:      in.UserID,
		ReviewTitle: in.ReviewTitle,
		ReviewText:  in.ReviewText,
		Rating:      in.Rating,
	}
	if err := db.Create(&r).Error; err != nil {
		// map duplicate เป็น 409 (กันกรณีเล็ดรอดมาชน unique)
		if errors.Is(err, gorm.ErrDuplicatedKey) ||
			strings.Contains(strings.ToLower(err.Error()), "unique") {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "already_reviewed",
				"message": "คุณได้รีวิวเกมนี้แล้ว กรุณาแก้ไขรีวิวเดิม",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create_failed"})
		return
	}

	var out entity.Review
	_ = db.Preload("User").Preload("Game").First(&out, r.ID).Error
	c.JSON(http.StatusCreated, out)
}

// GET /reviews
func FindReviews(c *gin.Context) {
	db := configs.DB()
	var list []entity.Review
	if err := db.Preload("User").Preload("Game").
		Order("updated_at DESC").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list_failed"})
		return
	}
	c.JSON(http.StatusOK, list)
}

// GET /reviews/:id
func GetReviewByID(c *gin.Context) {
	id := c.Param("id")
	db := configs.DB()
	var row entity.Review
	if err := db.Preload("User").Preload("Game").First(&row, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "get_failed"})
		return
	}
	c.JSON(http.StatusOK, row)
}

// PUT /reviews/:id
func UpdateReview(c *gin.Context) {
	id := c.Param("id")
	var in reviewUpdateDTO
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	db := configs.DB()
	var r entity.Review
	if err := db.First(&r, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "get_failed"})
		return
	}

	if in.ReviewTitle != nil {
		r.ReviewTitle = *in.ReviewTitle
	}
	if in.ReviewText != nil {
		r.ReviewText = *in.ReviewText
	}
	if in.Rating != nil {
		r.Rating = clampRating(*in.Rating)
	}

	if err := db.Save(&r).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update_failed"})
		return
	}

	var out entity.Review
	_ = db.Preload("User").Preload("Game").First(&out, r.ID).Error
	c.JSON(http.StatusOK, out)
}

// DELETE /reviews/:id
func DeleteReview(c *gin.Context) {
	id := c.Param("id")
	db := configs.DB()
	if err := db.Unscoped().Delete(&entity.Review{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete_failed"})
		return
	}
	c.Status(http.StatusNoContent)
}

// GET /games/:id/reviews
func FindReviewsByGame(c *gin.Context) {
	gameID := c.Param("id")
	db := configs.DB()
	var list []entity.Review
	if err := db.Preload("User").Preload("Likes").
		Where("game_id = ?", gameID).
		Order("updated_at DESC").
		Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list_failed"})
		return
	}

	// แปลงให้มีฟิลด์ likes เป็นจำนวนไลก์แทนการส่งรายละเอียดไลก์ทั้งหมด
	out := make([]gin.H, 0, len(list))
	for _, r := range list {
		out = append(out, gin.H{
			"ID":           r.ID,
			"CreatedAt":    r.CreatedAt,
			"UpdatedAt":    r.UpdatedAt,
			"DeletedAt":    r.DeletedAt,
			"review_title": r.ReviewTitle,
			"review_text":  r.ReviewText,
			"rating":       r.Rating,
			"user_id":      r.UserID,
			"user":         r.User,
			"game_id":      r.GameID,
			"game":         r.Game,
			"likes":        len(r.Likes),
		})
	}

	c.JSON(http.StatusOK, out)
}

// POST /reviews/:id/toggle_like
func ToggleReviewLike(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		UserID uint `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	rid, _ := strconv.Atoi(id)
	db := configs.DB()

	// หา like เดิม
	var like entity.Review_Like
	err := db.Where("review_id = ? AND user_id = ?", rid, body.UserID).First(&like).Error
	liked := true
	if err == nil {
		// มีแล้ว => ลบ (unlike)
		if err := db.Unscoped().Delete(&like).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "toggle_failed"})
			return
		}
		liked = false
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "toggle_failed"})
		return
	} else {
		// ยังไม่มี => เพิ่ม like
		newLike := entity.Review_Like{
			ReviewID: uint(rid),
			UserID:   body.UserID,
		}
		if err := db.Create(&newLike).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "toggle_failed"})
			return
		}
	}

	var cnt int64
	db.Model(&entity.Review_Like{}).Where("review_id = ?", rid).Count(&cnt)

	c.JSON(http.StatusOK, gin.H{
		"review_id": rid,
		"likes":     cnt,
		"liked":     liked,
	})
}
