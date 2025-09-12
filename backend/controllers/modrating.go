// PATH: controllers/mod_ratings.go
package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func GetModRatings(c *gin.Context) {
	var rows []entity.ModRating

	q := configs.DB().Model(&entity.ModRating{})

	// filter by mod
	if mid := c.Query("mod_id"); mid != "" {
		q = q.Where("mod_id = ?", mid)
	}

	// OPTIONAL: filter by user (ผ่าน user_games.user_id)
	if uid := c.Query("user_id"); uid != "" {
		q = q.Joins("JOIN user_games ug ON ug.id = mod_ratings.user_game_id").
			Where("ug.user_id = ?", uid)
	}

	// อยากได้ relation ด้วยก็ preload
	q = q.Preload("UserGame").Preload("Mod")

	if err := q.Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func GetModRatingById(c *gin.Context) {
	id := c.Param("id")
	var row entity.ModRating
	if tx := configs.DB().Preload("UserGame").Preload("Mod").First(&row, "id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod rating not found"})
		return
	}
	c.JSON(http.StatusOK, row)
}

type modRatingInput struct {
	Rating       string     `json:"rating" binding:"required"`
	Comment      string     `json:"comment"` // ✅ ใช้แทน review
	Review       string     `json:"review"`  // △ รองรับของเก่า (optional)
	PurchaseDate *time.Time `json:"purchase_date"`
	UserGameID   uint       `json:"user_game_id" binding:"required"`
	ModID        uint       `json:"mod_id" binding:"required"`
}

func CreateModRating(c *gin.Context) {
	var in modRatingInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	comment := in.Comment
	if comment == "" && in.Review != "" { // backward-compat
		comment = in.Review
	}

	row := entity.ModRating{
		Rating:     in.Rating,
		Comment:    comment,
		UserGameID: in.UserGameID,
		ModID:      in.ModID,
	}
	if in.PurchaseDate != nil {
		row.PurchaseDate = *in.PurchaseDate
	}

	if err := configs.DB().Create(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, row)
}

func UpdateModRating(c *gin.Context) {
	id := c.Param("id")

	var row entity.ModRating
	if tx := configs.DB().First(&row, "id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod rating not found"})
		return
	}

	var in modRatingInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	patch := map[string]any{}
	if in.Rating != "" {
		patch["rating"] = in.Rating
	}
	if in.Comment != "" {
		patch["review"] = in.Comment // ✅ column review
	} else if in.Review != "" {
		patch["review"] = in.Review // รองรับเก่า
	}
	if in.PurchaseDate != nil {
		patch["purchase_date"] = *in.PurchaseDate
	}
	// (เลือกได้ว่าจะเปิดให้แก้ mod_id/user_game_id หรือไม่)
	if in.UserGameID != 0 {
		patch["user_game_id"] = in.UserGameID
	}
	if in.ModID != 0 {
		patch["mod_id"] = in.ModID
	}

	if err := configs.DB().Model(&row).Updates(patch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().First(&row, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, row)
}

func DeleteModRating(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM mod_ratings WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod rating not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
