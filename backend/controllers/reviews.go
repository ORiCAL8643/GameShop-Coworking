// backend/controllers/reviews.go
package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==== Review Controllers ====

// POST /reviews
func CreateReview(c *gin.Context) {
	var body entity.Review
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body: " + err.Error()})
		return
	}
	// minimal validation
	if body.UserID == 0 || body.GameID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id and game_id are required"})
		return
	}
	if body.Rating < 0 || body.Rating > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rating must be 0-10"})
		return
	}
	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed: " + err.Error()})
		return
	}
	// reload
	var row entity.Review
	if err := configs.DB().Preload("User").Preload("Game").First(&row, body.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reload failed: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, row)
}

// GET /reviews
// optional: ?game_id=&user_id=
func FindReviews(c *gin.Context) {
	db := configs.DB().Model(&entity.Review{}).Preload("User").Preload("Game")
	if gid := c.Query("game_id"); gid != "" {
		db = db.Where("game_id = ?", gid)
	}
	if uid := c.Query("user_id"); uid != "" {
		db = db.Where("user_id = ?", uid)
	}
	var rows []entity.Review
	if err := db.Order("created_at desc").Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// GET /reviews/:id
func GetReviewByID(c *gin.Context) {
	var row entity.Review
	if err := configs.DB().Preload("User").Preload("Game").First(&row, c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, row)
}

// PUT /reviews/:id
func UpdateReview(c *gin.Context) {
	var payload entity.Review
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body: " + err.Error()})
		return
	}
	var row entity.Review
	db := configs.DB()
	if err := db.First(&row, c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	// apply updatable fields
	update := map[string]any{}
	if payload.ReviewTitle != "" { update["review_title"] = payload.ReviewTitle }
	if payload.ReviewText != "" { update["review_text"] = payload.ReviewText }
	if payload.Rating != 0     { update["rating"] = payload.Rating }
	if err := db.Model(&row).Updates(update).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed: " + err.Error()})
		return
	}
	if err := db.Preload("User").Preload("Game").First(&row, row.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reload failed: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, row)
}

// DELETE /reviews/:id
func DeleteReview(c *gin.Context) {
	if tx := configs.DB().Delete(&entity.Review{}, c.Param("id")); tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": tx.Error.Error()})
		return
	} else if tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// POST /reviews/:id/toggle_like   { "user_id": 123 }
func ToggleReviewLike(c *gin.Context) {
	var req struct {
		UserID uint `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	db := configs.DB()

	// load review
	var review entity.Review
	if err := db.First(&review, c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// check existing like
	var like entity.Review_Like
	if err := db.Where("review_id = ? AND user_id = ?", review.ID, req.UserID).First(&like).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// create like
			newLike := entity.Review_Like{ReviewID: review.ID, UserID: req.UserID, GameID: review.GameID}
			if err := db.Create(&newLike).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "like failed: " + err.Error()})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		// found => toggle off (delete)
		if err := db.Delete(&like).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unlike failed: " + err.Error()})
			return
		}
	}

	// return new like count
	var count int64
	db.Model(&entity.Review_Like{}).Where("review_id = ?", review.ID).Count(&count)
	c.JSON(http.StatusOK, gin.H{"review_id": review.ID, "likes": count})
}

// FindReviewsByGame handles GET /games/:id/reviews
// and returns all reviews for a particular game.
func FindReviewsByGame(c *gin.Context) {
	var rows []entity.Review
	if err := configs.DB().
		Where("game_id = ?", c.Param("id")).
		Preload("User").Preload("Game").
		Order("created_at desc").
		Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}
