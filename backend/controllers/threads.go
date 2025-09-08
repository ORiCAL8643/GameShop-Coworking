package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /threads
func CreateThread(c *gin.Context) {
	var body entity.Thread
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
		return
	}

	db := configs.DB()
	// เช็ค FK: UserID
	var user entity.User
	if tx := db.Where("id = ?", body.UserID).First(&user); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id not found"})
		return
	}
	// เช็ค FK: GameID
	var game entity.Game
	if tx := db.Where("id = ?", body.GameID).First(&game); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "game_id not found"})
		return
	}

	if err := db.Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

// GET /threads  (optional: ?user_id=...  ?game_id=...  ?sort=likes|comments|latest)
func FindThreads(c *gin.Context) {
	type ThreadWithCounts struct {
		entity.Thread
		LikesCount    int64 `json:"likes" gorm:"column:likes_count"`
		CommentsCount int64 `json:"comments" gorm:"column:comments_count"`
	}

	var threads []ThreadWithCounts
	db := configs.DB()

	userID := c.Query("user_id")
	gameID := c.Query("game_id")
	sort := c.DefaultQuery("sort", "latest")

	tx := db.Model(&entity.Thread{}).
		Select("threads.*, COUNT(DISTINCT r.id) AS likes_count, COUNT(DISTINCT c.id) AS comments_count").
		Joins("LEFT JOIN reactions r ON r.target_id = threads.id AND r.target_type = ? AND r.type = ?", "thread", "like").
		Joins("LEFT JOIN comments c ON c.thread_id = threads.id").
		Preload("User").
		Preload("Game").
		Group("threads.id")

	if userID != "" {
		tx = tx.Where("threads.user_id = ?", userID)
	}
	if gameID != "" {
		tx = tx.Where("threads.game_id = ?", gameID)
	}

	switch sort {
	case "likes":
		tx = tx.Order("likes_count DESC")
	case "comments":
		tx = tx.Order("comments_count DESC")
	default:
		tx = tx.Order("threads.created_at DESC")
	}

	if err := tx.Find(&threads).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, threads)
}

// GET /threads/:id
func FindThreadByID(c *gin.Context) {
	var thread entity.Thread
	id := c.Param("id")
	if tx := configs.DB().Preload("User").Preload("Game").First(&thread, id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, thread)
}

// PUT /threads/:id
func UpdateThread(c *gin.Context) {
	var payload entity.Thread
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := configs.DB()
	var thread entity.Thread
	if tx := db.First(&thread, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	if err := db.Model(&thread).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

// DELETE /threads/:id
func DeleteThreadByID(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM threads WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
