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
	"gorm.io/gorm"
)

// GET /mods?game_id=&uploader_id=&q=
func GetMods(c *gin.Context) {
	var mods []entity.Mod

	q := configs.DB().Model(&entity.Mod{})

	if gid := c.Query("game_id"); gid != "" {
		q = q.Where("game_id = ?", gid)
	}
	if uid := c.Query("uploader_id"); uid != "" {
		q = q.Where("user_id = ?", uid) // ฟิลเตอร์ตามผู้อัปโหลด
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
	db := configs.DB()
	if tx := db.Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}
	db.Model(&mod).UpdateColumn("view_count", gorm.Expr("view_count + 1"))
	mod.ViewCount++
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
// อัปโหลดม็อด: ต้องล็อกอิน + ต้องเป็นเจ้าของเกม
func CreateMod(c *gin.Context) {
	title := c.PostForm("title")
	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}
	description := c.PostForm("description")

	// ต้องมี game_id
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

	// OPTIONAL: user_game_id
	var userGameID *uint = nil
	if userGameIDStr := c.PostForm("user_game_id"); userGameIDStr != "" {
		if ugid64, err := strconv.ParseUint(userGameIDStr, 10, 64); err == nil {
			ugid := uint(ugid64)
			userGameID = &ugid
		}
	}

	// ต้องล็อกอิน
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

	// ต้องเป็นเจ้าของเกม
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

	// ต้องมีไฟล์ม็อด
	modFile, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mod file is required"})
		return
	}
	// รูปพรีวิว (ออปชัน)
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
// อัปเดตเฉพาะฟิลด์ที่อนุญาต + ถ้าเปลี่ยนเกมต้องเป็นเจ้าของเกม
func UpdateMod(c *gin.Context) {
	id := c.Param("id")

	var mod entity.Mod
	if tx := configs.DB().Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}

	// (ถ้า main.go มี EnsureModOwner แล้ว ส่วนนี้เป็น safety ซ้ำชั้น)
	if uidAny, ok := c.Get("userID"); ok {
		uid := uidAny.(uint)
		if uid != mod.UserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// whitelist ฟิลด์ที่อัปเดตได้
	type updateInput struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
		GameID      *uint   `json:"game_id"`
		UserGameID  *uint   `json:"user_game_id"`
	}
	var input updateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ถ้าจะเปลี่ยนเกม → ต้องเป็นเจ้าของเกมใหม่
	if input.GameID != nil {
		uid := c.GetUint("userID")
		var cnt int64
		if err := configs.DB().
			Model(&entity.UserGame{}).
			Where("user_id = ? AND game_id = ?", uid, *input.GameID).
			Count(&cnt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if cnt == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "you must own the target game"})
			return
		}
	}

	updates := map[string]interface{}{}
	if input.Title != nil {
		updates["title"] = *input.Title
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if input.GameID != nil {
		updates["game_id"] = *input.GameID
	}
	if input.UserGameID != nil {
		updates["user_game_id"] = *input.UserGameID
	}

	if len(updates) == 0 {
		c.JSON(http.StatusOK, mod) // ไม่มีอะไรจะอัปเดต
		return
	}

	if err := configs.DB().Model(&mod).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Where("id = ?", id).First(&mod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mod)
}

// PUT /mods/:id/file
// form-data: file=<binary>
func ReplaceModFile(c *gin.Context) {
	id := c.Param("id")

	var mod entity.Mod
	if tx := configs.DB().Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}

	// (ถ้า main.go มี EnsureModOwner แล้ว ส่วนนี้เป็น safety ซ้ำชั้น)
	if uidAny, ok := c.Get("userID"); ok {
		uid := uidAny.(uint)
		if uid != mod.UserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing file"})
		return
	}

	// บันทึกไฟล์ใหม่
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename)
	dirFS := filepath.Join("uploads", "mods")
	if err := os.MkdirAll(dirFS, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create directory"})
		return
	}
	pathFS := filepath.Join(dirFS, filename)
	if err := c.SaveUploadedFile(file, pathFS); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}
	pathWeb := path.Join("uploads", "mods", filename)

	// อัปเดต DB
	if err := configs.DB().Model(&mod).Update("file_path", pathWeb).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// อ่านกลับ
	if err := configs.DB().Where("id = ?", id).First(&mod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mod)
}

// PUT /mods/:id/image
// form-data: image=<binary>
func ReplaceModImage(c *gin.Context) {
	id := c.Param("id")

	var mod entity.Mod
	if tx := configs.DB().Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}

	// (ถ้า main.go มี EnsureModOwner แล้ว ส่วนนี้เป็น safety ซ้ำชั้น)
	if uidAny, ok := c.Get("userID"); ok {
		uid := uidAny.(uint)
		if uid != mod.UserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	img, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing image"})
		return
	}

	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), img.Filename)
	dirFS := filepath.Join("uploads", "mod_images")
	if err := os.MkdirAll(dirFS, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create directory"})
		return
	}
	pathFS := filepath.Join(dirFS, filename)
	if err := c.SaveUploadedFile(img, pathFS); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save image"})
		return
	}
	pathWeb := path.Join("uploads", "mod_images", filename)

	if err := configs.DB().Model(&mod).Update("image_path", pathWeb).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := configs.DB().Where("id = ?", id).First(&mod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, mod)
}

// DELETE /mods/:id
func DeleteMod(c *gin.Context) {
	id := c.Param("id")

	var mod entity.Mod
	if tx := configs.DB().Where("id = ?", id).First(&mod); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}

	// (ถ้า main.go มี EnsureModOwner แล้ว ส่วนนี้เป็น safety ซ้ำชั้น)
	if uidAny, ok := c.Get("userID"); ok {
		uid := uidAny.(uint)
		if uid != mod.UserID {
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

// GET /mods/:id/download
func DownloadMod(c *gin.Context) {
	id := c.Param("id")
	var mod entity.Mod
	db := configs.DB()
	if tx := db.First(&mod, id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}
	db.Model(&mod).UpdateColumn("download_count", gorm.Expr("download_count + 1"))
	mod.DownloadCount++
	c.File(mod.FilePath)
}
