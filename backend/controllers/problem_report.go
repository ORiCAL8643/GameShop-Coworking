// controllers/report_controller.go
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
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /reports (multipart/form-data)
func CreateReport(c *gin.Context) {
	db := configs.DB()

	title := strings.TrimSpace(c.PostForm("title"))
	desc := strings.TrimSpace(c.PostForm("description"))
	status := strings.TrimSpace(c.PostForm("status"))
	if status == "" {
		status = "open"
	}
	userID, _ := strconv.Atoi(c.PostForm("user_id"))
	gameID, _ := strconv.Atoi(c.PostForm("game_id"))

	if title == "" || desc == "" || userID <= 0 || gameID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields"})
		return
	}

	// ตรวจ FK user / game
	var u entity.User
	if err := db.First(&u, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	var g entity.Game
	if err := db.First(&g, gameID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "game not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	report := entity.ProblemReport{
		Title:       title,
		Description: desc,
		Status:      status,
		UserID:      uint(userID),
		GameID:      uint(gameID),
	}
	if err := db.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// แนบไฟล์ (ของผู้ใช้) → uploads/reports/yyyymmdd/...
	if form, _ := c.MultipartForm(); form != nil {
		files := form.File["attachments"]
		if len(files) == 0 {
			files = form.File["file"]
		}
		if len(files) > 0 {
			dir := filepath.Join("uploads", "reports", time.Now().Format("20060102"))
			_ = os.MkdirAll(dir, 0o755)
			for _, f := range files {
				name := fmt.Sprintf("%d_%s", time.Now().UnixNano(), f.Filename)
				dst := filepath.Join(dir, name)
				relPath := filepath.ToSlash(filepath.Join("uploads", "reports", time.Now().Format("20060102"), name))

				if err := c.SaveUploadedFile(f, dst); err != nil {
					continue
				}
				_ = db.Create(&entity.ProblemAttachment{
					FilePath: relPath,
					ReportID: report.ID,
				}).Error
			}
		}
	}

	_ = db.Preload("User").Preload("Attachments").First(&report, report.ID).Error
	c.JSON(http.StatusCreated, report)
}

// GET /reports?user_id=&game_id=&page=&limit=
func FindReports(c *gin.Context) {
	db := configs.DB()

	var (
		userID, gameID uint
		page           = 1
		limit          = 20
	)
	if v := c.Query("user_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			userID = uint(n)
		}
	}
	if v := c.Query("game_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			gameID = uint(n)
		}
	}
	if v := c.Query("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			page = n
		}
	}
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}

	offset := (page - 1) * limit

	q := db.Model(&entity.ProblemReport{})
	if userID > 0 {
		q = q.Where("user_id = ?", userID)
	}
	if gameID > 0 {
		q = q.Where("game_id = ?", gameID)
	}

	var items []entity.ProblemReport
	if err := q.
		Preload("User").
		Preload("Attachments").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GET /reports/:id
func GetReportByID(c *gin.Context) {
	db := configs.DB()
	id, _ := strconv.Atoi(c.Param("id"))

	var rp entity.ProblemReport
	if err := db.Preload("User").Preload("Attachments").First(&rp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rp)
}

type updateReportInput struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Status      *string `json:"status,omitempty"`
	Resolve     *bool   `json:"resolve,omitempty"`
}

// PUT /reports/:id
func UpdateReport(c *gin.Context) {
	db := configs.DB()
	id, _ := strconv.Atoi(c.Param("id"))

	var rp entity.ProblemReport
	if err := db.First(&rp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var in updateReportInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "detail": err.Error()})
		return
	}

	if in.Title != nil {
		rp.Title = strings.TrimSpace(*in.Title)
	}
	if in.Description != nil {
		rp.Description = strings.TrimSpace(*in.Description)
	}
	if in.Status != nil {
		rp.Status = strings.TrimSpace(*in.Status)
	}
	if in.Resolve != nil {
		if *in.Resolve {
			rp.ResolvedAt = time.Now()
			if rp.Status == "open" {
				rp.Status = "resolved"
			}
		} else {
			rp.ResolvedAt = time.Time{}
			if rp.Status == "resolved" {
				rp.Status = "open"
			}
		}
	}

	if err := db.Save(&rp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	_ = db.Preload("User").Preload("Attachments").First(&rp, rp.ID).Error
	c.JSON(http.StatusOK, rp)
}

// DELETE /reports/:id
func DeleteReport(c *gin.Context) {
	db := configs.DB()
	id, _ := strconv.Atoi(c.Param("id"))
	if err := db.Delete(&entity.ProblemReport{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// ✅ POST /reports/:id/reply
// ส่งข้อความ/ไฟล์ตอบกลับ แล้ว "สร้าง/อัปเดต" Notification ให้เหลือเพียงเรคคอร์ดเดียวเสมอ ต่อ (user_id, type, report_id)
func ReplyReport(c *gin.Context) {
	db := configs.DB()
	id, _ := strconv.Atoi(c.Param("id"))

	var rp entity.ProblemReport
	if err := db.First(&rp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	text := strings.TrimSpace(c.PostForm("text"))

	// ✅ บันทึกข้อความตอบกลับลงใน report
	if text != "" {
		rp.Reply = text
	}

	// ✅ แนบไฟล์จากแอดมิน (เก็บไว้ที่ uploads/replies/yyyymmdd/...)
	attachCount := 0
	if form, _ := c.MultipartForm(); form != nil {
		files := form.File["attachments"]
		attachCount = len(files)
		if attachCount > 0 {
			dir := filepath.Join("uploads", "replies", time.Now().Format("20060102"))
			_ = os.MkdirAll(dir, 0o755)
			for _, f := range files {
				name := fmt.Sprintf("%d_%s", time.Now().UnixNano(), f.Filename)
				dst := filepath.Join(dir, name)
				relPath := filepath.ToSlash(filepath.Join("uploads", "replies", time.Now().Format("20060102"), name))

				if err := c.SaveUploadedFile(f, dst); err != nil {
					continue
				}
				_ = db.Create(&entity.ProblemAttachment{
					FilePath: relPath,
					ReportID: rp.ID,
				}).Error
			}
		}
	}

	// ✅ ทำข้อความแจ้งเตือน
	msg := text
	if msg == "" {
		if attachCount > 0 {
			msg = "แอดมินได้ตอบกลับพร้อมไฟล์แนบ"
		} else {
			msg = "แอดมินได้ตอบกลับคำร้องของคุณ"
		}
	} else if attachCount > 0 {
		msg = fmt.Sprintf("%s (แนบไฟล์ %d ไฟล์)", msg, attachCount)
	}

	// ✅ สร้าง/อัปเดตแจ้งเตือนให้มีเพียงเรคคอร์ดเดียว ต่อ (user_id, type, report_id)
	var noti entity.Notification
	err := db.Where("user_id = ? AND type = ? AND report_id = ?", rp.UserID, "report_reply", rp.ID).
		First(&noti).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// ยังไม่มี → สร้างใหม่
		_ = db.Create(&entity.Notification{
			Title:    fmt.Sprintf("ตอบกลับคำร้อง #%d", rp.ID),
			Message:  msg,
			Type:     "report_reply",
			UserID:   rp.UserID,
			ReportID: &rp.ID,
			IsRead:   false,
		}).Error
	} else if err == nil {
		// มีอยู่แล้ว → อัปเดตเนื้อหา + ทำสถานะเป็นยังไม่อ่าน
		noti.Title = fmt.Sprintf("ตอบกลับคำร้อง #%d", rp.ID)
		noti.Message = msg
		noti.IsRead = false
		_ = db.Save(&noti).Error
	} else {
		// error อื่น ๆ ไม่ให้ล้ม flow หลัก
	}

	// ✅ ปิดงานเป็น resolved
	rp.Status = "resolved"
	rp.ResolvedAt = time.Now()
	if err := db.Save(&rp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_ = db.Preload("User").Preload("Attachments").First(&rp, rp.ID).Error
	c.JSON(http.StatusOK, rp)
}
