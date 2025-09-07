// backend/controllers/promotions.go
package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==== Promotion Controllers ====

// helper: ensure end after start
func validatePromoWindow(start, end time.Time) bool {
	return !start.IsZero() && !end.IsZero() && end.After(start)
}

type createPromotionRequest struct {
	DiscountType  entity.DiscountType `json:"discount_type"   binding:"required"`
	DiscountValue int                 `json:"discount_value"  binding:"required,min=0"`
	StartDate     time.Time           `json:"start_date"      binding:"required"`
	EndDate       time.Time           `json:"end_date"        binding:"required"`
	PromoImage    string              `json:"promo_image"`
	Status        *bool               `json:"status"`
	UserID        uint                `json:"user_id"`
	GameIDs       []uint              `json:"game_ids"` // optional: set links to games
}

// POST /promotions
func CreatePromotion(c *gin.Context) {
	var req createPromotionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body: " + err.Error()})
		return
	}
	if !validatePromoWindow(req.StartDate, req.EndDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_date must be after start_date"})
		return
	}

	promo := entity.Promotion{
		DiscountType:  req.DiscountType,
		DiscountValue: req.DiscountValue,
		StartDate:     req.StartDate,
		EndDate:       req.EndDate,
		PromoImage:    req.PromoImage,
		Status:        true,
		UserID:        req.UserID,
	}
	if req.Status != nil {
		promo.Status = *req.Status
	}

	db := configs.DB()

	// validate games if provided
	var games []entity.Game
	if len(req.GameIDs) > 0 {
		if err := db.Where("id IN ?", req.GameIDs).Find(&games).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot load games: " + err.Error()})
			return
		}
		if len(games) != len(req.GameIDs) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "some game_ids were not found"})
			return
		}
		promo.Games = games
	}

	if err := db.Create(&promo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create promotion failed: " + err.Error()})
		return
	}

	// reload with relations for response
	if err := db.Preload("Games").First(&promo, promo.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reload failed: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, promo)
}

// GET /promotions
// query: status=true/false, active_now=true, with=games
func FindPromotions(c *gin.Context) {
	db := configs.DB().Model(&entity.Promotion{})
	with := c.Query("with")
	status := c.Query("status")
	activeNow := c.Query("active_now")

	if with == "games" {
		db = db.Preload("Games")
	}
	if status == "true" || status == "false" {
		db = db.Where("status = ?", status == "true")
	}
	if activeNow == "true" {
		now := time.Now()
		db = db.Where("start_date <= ? AND end_date >= ? AND status = 1", now, now)
	}

	var rows []entity.Promotion
	if err := db.Order("start_date desc").Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// GET /promotions/:id
func GetPromotionByID(c *gin.Context) {
	var row entity.Promotion
	db := configs.DB().Preload("Games")
	if err := db.First(&row, c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "promotion not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, row)
}

type updatePromotionRequest struct {
	DiscountType  *entity.DiscountType `json:"discount_type"`
	DiscountValue *int                 `json:"discount_value"  binding:"omitempty,min=0"`
	StartDate     *time.Time           `json:"start_date"`
	EndDate       *time.Time           `json:"end_date"`
	PromoImage    *string              `json:"promo_image"`
	Status        *bool                `json:"status"`
	UserID        *uint                `json:"user_id"`
	GameIDs       *[]uint              `json:"game_ids"` // if present, replace mapping
}

// PUT /promotions/:id
func UpdatePromotion(c *gin.Context) {
	var req updatePromotionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body: " + err.Error()})
		return
	}

	var row entity.Promotion
	db := configs.DB()
	if err := db.First(&row, c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "promotion not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// validate date window if both provided
	if req.StartDate != nil && req.EndDate != nil {
		if !validatePromoWindow(*req.StartDate, *req.EndDate) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "end_date must be after start_date"})
			return
		}
	}
	// apply partial fields
	updates := map[string]any{}
	if req.DiscountType != nil { updates["discount_type"] = *req.DiscountType }
	if req.DiscountValue != nil { updates["discount_value"] = *req.DiscountValue }
	if req.StartDate != nil { updates["start_date"] = *req.StartDate }
	if req.EndDate != nil { updates["end_date"] = *req.EndDate }
	if req.PromoImage != nil { updates["promo_image"] = *req.PromoImage }
	if req.Status != nil { updates["status"] = *req.Status }
	if req.UserID != nil { updates["user_id"] = *req.UserID }

	if len(updates) > 0 {
		if err := db.Model(&row).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// replace game mapping if provided
	if req.GameIDs != nil {
		var games []entity.Game
		if len(*req.GameIDs) > 0 {
			if err := db.Where("id IN ?", *req.GameIDs).Find(&games).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "cannot load games: " + err.Error()})
				return
			}
			if len(games) != len(*req.GameIDs) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "some game_ids were not found"})
				return
			}
		}
		if err := db.Model(&row).Association("Games").Replace(games); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "update games failed: " + err.Error()})
			return
		}
	}

	if err := db.Preload("Games").First(&row, row.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reload failed: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, row)
}

// DELETE /promotions/:id
func DeletePromotion(c *gin.Context) {
	if tx := configs.DB().Delete(&entity.Promotion{}, c.Param("id")); tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": tx.Error.Error()})
		return
	} else if tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "promotion not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// POST /promotions/:id/games
// Replace mapping with provided game_ids (idempotent)
func SetPromotionGames(c *gin.Context) {
	var req struct {
		GameIDs []uint `json:"game_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	db := configs.DB()
	var promo entity.Promotion
	if err := db.First(&promo, c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "promotion not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	var games []entity.Game
	if len(req.GameIDs) > 0 {
		if err := db.Where("id IN ?", req.GameIDs).Find(&games).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot load games: " + err.Error()})
			return
		}
		if len(games) != len(req.GameIDs) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "some game_ids were not found"})
			return
		}
	}
	if err := db.Model(&promo).Association("Games").Replace(games); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update games failed: " + err.Error()})
		return
	}
	if err := db.Preload("Games").First(&promo, promo.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reload failed: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, promo)
}

// GET /promotions-active
func FindActivePromotions(c *gin.Context) {
	now := time.Now()
	var rows []entity.Promotion
	if err := configs.DB().
		Preload("Games").
		Where("status = 1 AND start_date <= ? AND end_date >= ?", now, now).
		Order("end_date asc").
		Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// util: apply discount to a price (for clients, optional)
func applyDiscount(price float64, t entity.DiscountType, v int) float64 {
	if v <= 0 {
		return price
	}
	switch t {
	case entity.DiscountPercent:
		return price * (1.0 - float64(v)/100.0)
	case entity.DiscountAmount:
		if price < float64(v) {
			return 0
		}
		return price - float64(v)
	default:
		return price
	}
}
