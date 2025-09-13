// backend/controllers/promotions.go
package controllers

import (
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// ==== Promotion Controllers ====

// helper: ensure end after start
func validatePromoWindow(start, end time.Time) bool {
	return !start.IsZero() && !end.IsZero() && end.After(start)
}

func getUserID(c *gin.Context) (uint, error) {
	header := c.GetHeader("Authorization")
	if header == "" {
		return 0, fmt.Errorf("authorization header missing")
	}
	tokenString := strings.TrimPrefix(header, "Bearer ")
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret"
	}
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return 0, fmt.Errorf("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("invalid claims")
	}
	sub, ok := claims["sub"].(float64)
	if !ok {
		return 0, fmt.Errorf("invalid subject")
	}
	return uint(sub), nil
}

type createPromotionRequest struct {
	Title         string                `form:"title"          binding:"required"`
	Description   string                `form:"description"`
	DiscountType  entity.DiscountType   `form:"discount_type"   binding:"required"`
	DiscountValue int                   `form:"discount_value"  binding:"required,min=0"`
	StartDate     time.Time             `form:"start_date"      binding:"required"`
	EndDate       time.Time             `form:"end_date"        binding:"required"`
	PromoImage    *multipart.FileHeader `form:"promo_image"`
	Status        *bool                 `form:"status"`
	GameIDs       []uint                `form:"game_ids"` // optional: set links to games
}

// POST /promotions
func CreatePromotion(c *gin.Context) {
	uid, err := getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	var req createPromotionRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body: " + err.Error()})
		return
	}
	if !validatePromoWindow(req.StartDate, req.EndDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_date must be after start_date"})
		return
	}

	var promoImagePath string
	if req.PromoImage != nil {
		uploadDir := filepath.Join("uploads", "promotions")
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create directory"})
			return
		}
		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), req.PromoImage.Filename)
		path := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(req.PromoImage, path); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
			return
		}
		promoImagePath = path
	}

	promo := entity.Promotion{
		Title:         req.Title,
		Description:   req.Description,
		DiscountType:  req.DiscountType,
		DiscountValue: req.DiscountValue,
		StartDate:     req.StartDate,
		EndDate:       req.EndDate,
		PromoImage:    promoImagePath,
		Status:        true,
		UserID:        uid,
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
	Title         *string               `form:"title"`
	Description   *string               `form:"description"`
	DiscountType  *entity.DiscountType  `form:"discount_type"`
	DiscountValue *int                  `form:"discount_value"  binding:"omitempty,min=0"`
	StartDate     *time.Time            `form:"start_date"`
	EndDate       *time.Time            `form:"end_date"`
	PromoImage    *multipart.FileHeader `form:"promo_image"`
	Status        *bool                 `form:"status"`
	GameIDs       *[]uint               `form:"game_ids"` // if present, replace mapping
}

// PUT /promotions/:id
func UpdatePromotion(c *gin.Context) {
	var req updatePromotionRequest
	if err := c.ShouldBind(&req); err != nil {
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

	var promoImagePath string
	if req.PromoImage != nil {
		uploadDir := filepath.Join("uploads", "promotions")
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create directory"})
			return
		}
		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), req.PromoImage.Filename)
		path := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(req.PromoImage, path); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
			return
		}
		promoImagePath = path
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
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.DiscountType != nil {
		updates["discount_type"] = *req.DiscountType
	}
	if req.DiscountValue != nil {
		updates["discount_value"] = *req.DiscountValue
	}
	if req.StartDate != nil {
		updates["start_date"] = *req.StartDate
	}
	if req.EndDate != nil {
		updates["end_date"] = *req.EndDate
	}
	if promoImagePath != "" {
		updates["promo_image"] = promoImagePath
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

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
