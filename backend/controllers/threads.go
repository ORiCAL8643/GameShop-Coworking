package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /threads  (multipart/form-data)
// fields: title, content, game_id, user_id
// files: images (หลายไฟล์ได้)
func CreateThread(c *gin.Context) {
	title := strings.TrimSpace(c.PostForm("title"))
	content := strings.TrimSpace(c.PostForm("content"))
	gameIDStr := c.PostForm("game_id")
	userIDStr := c.PostForm("user_id")

	if title == "" || content == "" || gameIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title, content, game_id required"})
		return
	}

	db := configs.DB()

	// ตรวจเกม
	var g entity.Game
	if tx := db.First(&g, gameIDStr); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "game_id not found"})
		return
	}

	// แปลง user_id (optional)
	var userID *uint
	if userIDStr != "" {
		if v, err := strconv.Atoi(userIDStr); err == nil && v > 0 {
			uu := uint(v)
			// เช็คว่ามีผู้ใช้จริงไหม (optional แต่ดี)
			var u entity.User
			if tx := db.First(&u, uu); tx.RowsAffected == 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user_id not found"})
				return
			}
			userID = &uu
		}
	}

	th := entity.Thread{
		Title:     title,
		Content:   content,
		GameID:    g.ID,
		UserID:    userID,
		PostedAt:  time.Now(),
	}

	if err := db.Create(&th).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// บันทึกรูป (แนบได้เฉพาะตอนสร้างเธรด)
	form, err := c.MultipartForm()
	if err == nil && form != nil {
		files := form.File["images"]
		if len(files) > 0 {
			_ = os.MkdirAll("uploads/thread_images", 0755)
			for _, f := range files {
				// กันชื่อชนกัน
				name := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(f.Filename))
				path := filepath.Join("uploads", "thread_images", name)
				if err := c.SaveUploadedFile(f, path); err != nil {
					continue // ข้ามไฟล์ที่บันทึกไม่สำเร็จ
				}
				img := entity.ThreadImage{
					ThreadID: th.ID,
					FileURL:  "/" + path,
					AltText:  "",
				}
				_ = db.Create(&img).Error
			}
		}
	}

	_ = db.Preload("ThreadImages").Preload("Game").Preload("User").First(&th, th.ID)
	c.JSON(http.StatusCreated, th)
}

// GET /threads?game_id=&q=&limit=&offset=
func FindThreads(c *gin.Context) {
	db := configs.DB().Preload("ThreadImages").Preload("User").Preload("Game")
	if gid := c.Query("game_id"); gid != "" {
		db = db.Where("game_id = ?", gid)
	}
	if q := strings.TrimSpace(c.Query("q")); q != "" {
		db = db.Where("title LIKE ? OR content LIKE ?", "%"+q+"%", "%"+q+"%")
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	db = db.Order("id DESC").Limit(limit).Offset(offset)

	var rows []entity.Thread
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// GET /threads/:id
func FindThreadByID(c *gin.Context) {
	var row entity.Thread
	if tx := configs.DB().Preload("ThreadImages").Preload("User").Preload("Game").First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, row)
}

// PUT /threads/:id  (แก้เฉพาะ title/content)
type updateThreadBody struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}
func UpdateThread(c *gin.Context) {
	var body updateThreadBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	db := configs.DB()
	var row entity.Thread
	if tx := db.First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	updates := map[string]interface{}{}
	if strings.TrimSpace(body.Title) != "" {
		updates["title"] = strings.TrimSpace(body.Title)
	}
	if strings.TrimSpace(body.Content) != "" {
		updates["content"] = strings.TrimSpace(body.Content)
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no changes"})
		return
	}
	if err := db.Model(&row).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	_ = db.Preload("ThreadImages").Preload("User").Preload("Game").First(&row, row.ID)
	c.JSON(http.StatusOK, row)
}

// DELETE /threads/:id
func DeleteThread(c *gin.Context) {
	if tx := configs.DB().Delete(&entity.Thread{}, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
