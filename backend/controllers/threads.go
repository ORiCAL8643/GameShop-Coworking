package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"example.com/sa-gameshop/middlewares"
	"github.com/gin-gonic/gin"
	jwt "github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// POST /threads  (multipart: title, content, game_id, images[])
func CreateThread(c *gin.Context) {
	uid := c.GetUint("userID")
	if uid == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	title := strings.TrimSpace(c.PostForm("title"))
	content := strings.TrimSpace(c.PostForm("content"))
	gidStr := strings.TrimSpace(c.PostForm("game_id"))
	if title == "" || content == "" || gidStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title, content, game_id required"})
		return
	}
	gid, err := strconv.ParseUint(gidStr, 10, 64)
	if err != nil || gid == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid game_id"})
		return
	}

	db := configs.DB()
	var game entity.Game
	if err := db.First(&game, uint(gid)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "game_id not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	th := entity.Thread{
		Title:    title,
		Content:  content,
		GameID:   game.ID,
		UserID:   uid,
		PostedAt: time.Now(),
	}
	if err := db.Create(&th).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// แนบรูปเฉพาะตอนสร้าง
	if form, err := c.MultipartForm(); err == nil && form != nil {
		files := form.File["images"]
		if len(files) > 0 {
			_ = os.MkdirAll("uploads/thread_images", 0755)
			for _, f := range files {
				name := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(f.Filename))
				dst := filepath.Join("uploads", "thread_images", name)
				if err := c.SaveUploadedFile(f, dst); err == nil {
					_ = db.Create(&entity.ThreadImage{
						ThreadID: th.ID,
						FileURL:  "/" + dst,
					}).Error
				}
			}
		}
	}

	_ = db.Preload("ThreadImages").Preload("User").Preload("Game").First(&th, th.ID)
	c.JSON(http.StatusCreated, th)
}

// GET /threads?game_id=&q=&limit=&offset=
func FindThreads(c *gin.Context) {
	db := configs.DB().Preload("ThreadImages").Preload("User").Preload("Game")

	if gid := c.Query("game_id"); gid != "" {
		db = db.Where("game_id = ?", gid)
	}
	if q := strings.TrimSpace(c.Query("q")); q != "" {
		p := "%" + q + "%"
		db = db.Where("title LIKE ? OR content LIKE ?", p, p)
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var rows []entity.Thread
	if err := db.Order("id DESC").Limit(limit).Offset(offset).Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// GET /threads/:id
func FindThreadByID(c *gin.Context) {
	var row entity.Thread
	if tx := configs.DB().
		Preload("ThreadImages").
		Preload("User").
		Preload("Game").
		First(&row, c.Param("id")); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found"})
		return
	}

	// optional: get user id from Authorization or X-User-ID header
	var uid uint
	if auth := c.GetHeader("Authorization"); strings.HasPrefix(auth, "Bearer ") {
		tokenStr := strings.TrimPrefix(auth, "Bearer ")
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dev-secret"
		}
		token, err := jwt.ParseWithClaims(tokenStr, &middlewares.Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err == nil && token.Valid {
			claims := token.Claims.(*middlewares.Claims)
			uid = claims.UserID
			if uid == 0 && claims.Subject != "" {
				if n, err := strconv.Atoi(claims.Subject); err == nil {
					uid = uint(n)
				}
			}
		}
	} else if v := c.GetHeader("X-User-ID"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			uid = uint(n)
		}
	}

	liked := false
	if uid != 0 {
		var tl entity.ThreadLike
		if err := configs.DB().Where("thread_id = ? AND user_id = ?", row.ID, uid).First(&tl).Error; err == nil {
			liked = true
		}
	}

	type response struct {
		entity.Thread
		Liked bool `json:"liked"`
	}
	c.JSON(http.StatusOK, response{Thread: row, Liked: liked})
}

// PUT /threads/:id  (แก้ title/content)
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
	if s := strings.TrimSpace(body.Title); s != "" {
		updates["title"] = s
	}
	if s := strings.TrimSpace(body.Content); s != "" {
		updates["content"] = s
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
	if tx := configs.DB().Delete(&entity.Thread{}, c.Param("id")); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
