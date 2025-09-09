package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GET /mods
func GetMods(c *gin.Context) {
	var mods []entity.Mod
	if err := configs.DB().Find(&mods).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mods)
}

// GET /mods/:id
func GetModById(c *gin.Context) {
	id := c.Param("id")
	var mod entity.Mod
	if tx := configs.DB().Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}
	c.JSON(http.StatusOK, mod)
}

// POST /mods
func CreateMod(c *gin.Context) {
	title := c.PostForm("title")
	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}
	description := c.PostForm("description")

	userGameIDStr := c.PostForm("user_game_id")
	gameIDStr := c.PostForm("game_id")
	if userGameIDStr == "" || gameIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_game_id and game_id are required"})
		return
	}
	userGameID, err := strconv.ParseUint(userGameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_game_id"})
		return
	}
	gameID, err := strconv.ParseUint(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid game_id"})
		return
	}

	modFile, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mod file is required"})
		return
	}
	imageFile, _ := c.FormFile("image") // image optional

	// save mod file
	modDir := filepath.Join("uploads", "mods")
	if err := os.MkdirAll(modDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create mod directory"})
		return
	}
	modFilename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), modFile.Filename)
	modPath := filepath.Join(modDir, modFilename)
	if err := c.SaveUploadedFile(modFile, modPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save mod file"})
		return
	}

	imagePath := ""
	if imageFile != nil {
		imgDir := filepath.Join("uploads", "mod_images")
		if err := os.MkdirAll(imgDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create image directory"})
			return
		}
		imgFilename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), imageFile.Filename)
		imagePath = filepath.Join(imgDir, imgFilename)
		if err := c.SaveUploadedFile(imageFile, imagePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save image"})
			return
		}
	}

	mod := entity.Mod{
		Title:       title,
		Description: description,
		UploadDate:  time.Now(),
		FilePath:    modPath,
		ImagePath:   imagePath,
		Status:      "pending",
		UserGameID:  uint(userGameID),
		GameID:      uint(gameID),
	}
	if err := configs.DB().Create(&mod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, mod)
}

// PATCH /mods/:id
func UpdateMod(c *gin.Context) {
	id := c.Param("id")
	var mod entity.Mod
	if tx := configs.DB().Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}

	var input entity.Mod
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := configs.DB().Model(&mod).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mod)
}

// DELETE /mods/:id
func DeleteMod(c *gin.Context) {
	id := c.Param("id")
	if tx := configs.DB().Exec("DELETE FROM mods WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
