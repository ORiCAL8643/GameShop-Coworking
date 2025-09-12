package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

/*
// POST /games

	func CreateGame(c *gin.Context) {
		var body entity.Game
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
			return
		}
		if err := configs.DB().Create(&body).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, body)
	}

// GET /games  (optional: ?name=...)

	func FindGames(c *gin.Context) {
		var games []entity.Game
		name := c.Query("name")

		tx := configs.DB().Model(&entity.Game{})
		if name != "" {
			tx = tx.Where("game_name LIKE ?", "%"+name+"%")
		}

		if err := tx.Find(&games).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, games)
	}

// GET /games/:id

	func FindGameByID(c *gin.Context) {
		var game entity.Game
		if tx := configs.DB().First(&game, c.Param("id")); tx.RowsAffected == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
			return
		}
		c.JSON(http.StatusOK, game)
	}

// PUT /games/:id

	func UpdateGame(c *gin.Context) {
		var payload entity.Game
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var game entity.Game
		db := configs.DB()
		if tx := db.First(&game, c.Param("id")); tx.RowsAffected == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
			return
		}
		if err := db.Model(&game).Updates(payload).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
	}

// DELETE /games/:id

	func DeleteGameByID(c *gin.Context) {
		if tx := configs.DB().Exec("DELETE FROM games WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
	}
*/
func FindGames(c *gin.Context) {
	var games []entity.Game
	now := time.Now()
	if err := configs.DB().
		Preload("Categories").
		Preload("Promotions", "status = ? AND start_date <= ? AND end_date >= ?", true, now, now).
		Preload("Requests").
		Preload("MinimumSpec").
		Find(&games).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	type response struct {
		entity.Game
		DiscountedPrice float64 `json:"discounted_price"`
	}

	var res []response
	for _, g := range games {
		discounted := float64(g.BasePrice)
		for _, p := range g.Promotions {
			if price := applyDiscount(float64(g.BasePrice), p.DiscountType, p.DiscountValue); price < discounted {
				discounted = price
			}
		}
		res = append(res, response{Game: g, DiscountedPrice: discounted})
	}

	c.JSON(http.StatusOK, res)
}
func CreateGame(c *gin.Context) {
	var input struct {
		GameName        string `json:"game_name" binding:"required"`
		BasePrice       int    `json:"base_price" binding:"required"`
		AgeRating       int    `json:"age_rating"`
		ImgSrc          string `json:"img_src"`
		Minimum_spec_id int    `json:"minimum_spec_id" binding:"required"`
		CategoriesID    int    `json:"categories_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	games := entity.Game{
		GameName:       input.GameName,
		BasePrice:      input.BasePrice,
		AgeRating:      input.AgeRating,
		ImgSrc:         input.ImgSrc,
		Minimum_specID: uint(input.Minimum_spec_id),
		CategoriesID:   input.CategoriesID,
	}
	if err := configs.DB().Create(&games).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, games)
}
func UpdateGamebyID(c *gin.Context) {
	var games entity.Game
	id := c.Param("id")

	if err := configs.DB().First(&games, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if err := c.ShouldBindJSON(&games); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	configs.DB().Save(&games)
	c.JSON(http.StatusOK, games)
}
