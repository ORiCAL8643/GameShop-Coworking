package controllers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadGame รับไฟล์จาก field name = "file"
// เซฟที่ ./uploads/games/<timestamp>.<ext>
// ตอบกลับ url เป็น path สำหรับเอาไปใช้ใน FE/DB
func UploadGame(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	// ตรวจไฟล์
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allow := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
	}
	if !allow[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only jpg/jpeg/png/webp allowed"})
		return
	}

	// path ปลายทาง ./uploads/games
	baseDir := "uploads"
	subDir := "games"
	if err := os.MkdirAll(filepath.Join(baseDir, subDir), 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create uploads/games"})
		return
	}

	// ตั้งชื่อไฟล์กันชนกัน
	filename := time.Now().Format("20060102_150405.000000") + ext
	dst := filepath.Join(baseDir, subDir, filename)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save file failed"})
		return
	}

	// ส่ง path กลับ (ให้ FE เก็บใน DB)
	urlPath := "/" + filepath.ToSlash(filepath.Join("uploads", subDir, filename))
	c.JSON(http.StatusOK, gin.H{"url": urlPath})
}
