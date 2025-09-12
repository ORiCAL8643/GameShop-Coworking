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
func CreateMod(c *gin.Context) {
	title := c.PostForm("title")
	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}
	description := c.PostForm("description")

	// ✅ บังคับเฉพาะ game_id
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

	// ✅ ต้องมีไฟล์ม็อดเสมอ
	modFile, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mod file is required"})
		return
	}

	// 🟡 OPTIONAL: รูปตัวอย่างม็อด
	imageFile, _ := c.FormFile("image")

	// ---------- บันทึกไฟล์ม็อด (disk path) ----------
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
	// ✅ web path (forward slash)
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

	// ✅ คนอัปโหลด (ต้องใช้ร่วมกับ AuthRequired() เพื่อให้มี userID เสมอ)
	var uploaderID uint
	if uidAny, ok := c.Get("userID"); ok {
		if u, okC := uidAny.(uint); okC && u > 0 {
			uploaderID = u
		}
	}
	// ถ้าคุณต้อง “บังคับล็อกอิน” ให้ย้าย endpoint นี้ไว้ใต้ AuthRequired() และทำเช็คด้านล่าง:
	// if uploaderID == 0 { c.JSON(http.StatusUnauthorized, gin.H{"error":"please login first"}); return }

	// เตรียม record (เก็บ web path ลง DB)
	mod := entity.Mod{
		Title:       title,
		Description: description,
		UploadDate:  time.Now(), // ถ้ามี gorm.Model.CreatedAt แล้ว สามารถตัดออกได้
		FilePath:    modPathWeb,
		ImagePath:   imagePathWeb,
		Status:      "pending",
		GameID:      gameID,
		UserID:      uploaderID, // ✅ บันทึกคนอัปโหลด
	}
	if userGameID != nil {
		mod.UserGameID = userGameID
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

	// ✅ รองรับ JSON (แก้เฉพาะข้อมูลตัวหนังสือ)
	var input entity.Mod
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 🟡 ถ้าไม่อยากให้แก้ path/สถานะ ให้ล้างค่านี้ก่อนอัพเดต
	// input.FilePath = ""
	// input.ImagePath = ""
	// input.Status = ""

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

// DELETE /mods/:id
func DeleteMod(c *gin.Context) {
	id := c.Param("id")

	// 🟡 OPTIONAL: ตรวจสิทธิ์ลบ (เจ้าของหรือแอดมินเท่านั้น)
	// uidAny, _ := c.Get("userID")
	// if !canDelete(uidAny, id) { c.JSON(http.StatusForbidden, gin.H{"error":"forbidden"}); return }

	if tx := configs.DB().Exec("DELETE FROM mods WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "mod not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}