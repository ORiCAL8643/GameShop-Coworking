package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path" // ใช้ทำ web path (forward slash)
	"path/filepath"
	"strconv"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// GET /mods?game_id=&uploader_id=&q=
func GetMods(c *gin.Context) {
	var mods []entity.Mod

	q := configs.DB().Model(&entity.Mod{})

	if gid := c.Query("game_id"); gid != "" {
		q = q.Where("game_id = ?", gid)
	}
	if uid := c.Query("uploader_id"); uid != "" {
		q = q.Where("user_id = ?", uid) // ✅ ฟิลเตอร์ตามผู้อัปโหลด
	}
	if s := c.Query("q"); s != "" {
		like := "%" + s + "%"
		q = q.Where("title LIKE ? OR description LIKE ?", like, like)
	}

	if err := q.Find(&mods).Error; err != nil {
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

// ✅ GET /mods/mine?game_id=   (ต้องอยู่ใต้กลุ่ม AuthRequired())
func GetMyMods(c *gin.Context) {
	uidAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid := uidAny.(uint)

	var mods []entity.Mod
	q := configs.DB().Model(&entity.Mod{}).Where("user_id = ?", uid)

	if gid := c.Query("game_id"); gid != "" {
		q = q.Where("game_id = ?", gid)
	}
	if s := c.Query("q"); s != "" {
		like := "%" + s + "%"
		q = q.Where("title LIKE ? OR description LIKE ?", like, like)
	}

	if err := q.Find(&mods).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mods)
}

// POST /mods
// อนุญาตให้อัปโหลดได้โดยไม่ต้องมี user_game_id แต่จะบันทึก user_id ของผู้ที่อัปโหลด (ถ้า route อยู่ใต้ AuthRequired)
// แนะนำให้ย้าย endpoint นี้ไปอยู่ในกลุ่ม AuthRequired() เพื่อให้มี userID เสมอ
// POST /mods
func CreateMod(c *gin.Context) {
	title := c.PostForm("title")
	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}
	description := c.PostForm("description")

	// ✅ ต้องมี game_id
	gameIDStr := c.PostForm("game_id")
	if gameIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "game_id is required"})
		return
	}
	gameID64, err := strconv.ParseUint(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid game_id"})
		return
	}
	gameID := uint(gameID64)

	// 🟡 OPTIONAL: user_game_id (ไม่บังคับ)
	var userGameID *uint = nil
	if userGameIDStr := c.PostForm("user_game_id"); userGameIDStr != "" {
		if ugid64, err := strconv.ParseUint(userGameIDStr, 10, 64); err == nil {
			ugid := uint(ugid64)
			userGameID = &ugid
		}
	}

	// ✅ ต้องล็อกอิน (อยู่ใต้ AuthRequired แล้ว แต่กันเผื่อ)
	uidAny, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "please login first"})
		return
	}
	uploaderID, _ := uidAny.(uint)
	if uploaderID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "please login first"})
		return
	}

	// ✅ เช็ค “เป็นเจ้าของเกม” ก่อน (มี user_games ของเกมนี้จริง)
	// ถ้า client ส่ง user_game_id มา → ตรวจว่ามีแถวนี้และเป็นของ user เดียวกัน และ game ตรงกัน
	db := configs.DB()

	if userGameID != nil {
		var ug entity.UserGame
		if tx := db.Where("id = ? AND user_id = ? AND game_id = ?", *userGameID, uploaderID, gameID).First(&ug); tx.Error != nil || tx.RowsAffected == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "you must own this game (invalid user_game_id)"})
			return
		}
	} else {
		var cnt int64
		if err := db.Model(&entity.UserGame{}).
			Where("user_id = ? AND game_id = ?", uploaderID, gameID).
			Count(&cnt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if cnt == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "you must own this game to upload mods"})
			return
		}
	}

	// ✅ ต้องมีไฟล์ม็อด
	modFile, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mod file is required"})
		return
	}
	// (ออปชัน) รูปพรีวิว
	imageFile, _ := c.FormFile("image")

	// ---------- บันทึกไฟล์ม็อด ----------
	modFilename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), modFile.Filename)
	modDirFS := filepath.Join("uploads", "mods")
	if err := os.MkdirAll(modDirFS, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create mod directory"})
		return
	}
	modPathFS := filepath.Join(modDirFS, modFilename)
	if err := c.SaveUploadedFile(modFile, modPathFS); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save mod file"})
		return
	}
	modPathWeb := path.Join("uploads", "mods", modFilename)

	// ---------- บันทึกรูป (ถ้ามี) ----------
	imagePathWeb := ""
	if imageFile != nil {
		imgFilename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), imageFile.Filename)
		imgDirFS := filepath.Join("uploads", "mod_images")
		if err := os.MkdirAll(imgDirFS, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create image directory"})
			return
		}
		imgPathFS := filepath.Join(imgDirFS, imgFilename)
		if err := c.SaveUploadedFile(imageFile, imgPathFS); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save image"})
			return
		}
		imagePathWeb = path.Join("uploads", "mod_images", imgFilename)
	}

	// ✅ สร้าง record
	mod := entity.Mod{
		Title:       title,
		Description: description,
		UploadDate:  time.Now(),
		FilePath:    modPathWeb,
		ImagePath:   imagePathWeb,
		Status:      "pending",
		GameID:      gameID,
		UserID:      uploaderID,
	}
	if userGameID != nil {
		mod.UserGameID = userGameID
	}

	if err := db.Create(&mod).Error; err != nil {
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

	// ✅ อนุญาตเฉพาะเจ้าของ (หรือ admin ถ้าต้องการ)
	if uidAny, ok := c.Get("userID"); ok {
		uid := uidAny.(uint)
		// ถ้าต้องการให้แอดมินแก้ได้ ให้เอา roleID มาด้วย
		isOwner := uid == mod.UserID
		if !isOwner {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
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
	if err := configs.DB().Where("id = ?", id).First(&mod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mod)
}

func DeleteMod(c *gin.Context) {
	id := c.Param("id")

	var mod entity.Mod
	if tx := configs.DB().Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}

	// ✅ อนุญาตเฉพาะเจ้าของ (หรือ admin ถ้าต้องการ)
	if uidAny, ok := c.Get("userID"); ok {
		uid := uidAny.(uint)
		isOwner := uid == mod.UserID
		if !isOwner {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := configs.DB().Delete(&entity.Mod{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
