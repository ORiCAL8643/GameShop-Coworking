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

// ================= CREATE ==================
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

	if title == "" || desc == "" || userID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields"})
		return
	}

	// ตรวจ FK user
	var u entity.User
	if err := db.First(&u, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
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
	}
	if err := db.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// แนบไฟล์ (ของผู้ใช้)
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
				relPath := filepath.ToSlash(dst)

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

	_ = db.Preload("User").
		Preload("Attachments").
		Preload("Replies.Attachments").
		First(&report, report.ID).Error

	c.JSON(http.StatusCreated, report)
}

// ================= FIND LIST ==================
// GET /reports?user_id=&status=&page=&limit=
func FindReports(c *gin.Context) {
	db := configs.DB()

	var (
		userID uint
		page   = 1
		limit  = 20
	)

	if v := c.Query("user_id"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			userID = uint(n)
		}
	}

	status := strings.TrimSpace(c.Query("status"))
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
	if status != "" {
		q = q.Where("status = ?", status)
	}

	var items []entity.ProblemReport
	if err := q.
		Preload("User").
		Preload("Attachments").
		Preload("Replies.Attachments").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// ================= FIND ONE ==================
// GET /reports/:id
func GetReportByID(c *gin.Context) {
	db := configs.DB()
	id, _ := strconv.Atoi(c.Param("id"))

	var rp entity.ProblemReport
	if err := db.Preload("User").
		Preload("Attachments").
		Preload("Replies.Attachments").
		First(&rp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rp)
}

// ================= UPDATE ==================
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
			now := time.Now()
			rp.ResolvedAt = &now
			rp.Status = "resolved"
		} else {
			rp.ResolvedAt = nil
			if rp.Status == "resolved" {
				rp.Status = "open"
			}
		}
	}

	if err := db.Save(&rp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	_ = db.Preload("User").
		Preload("Attachments").
		Preload("Replies.Attachments").
		First(&rp, rp.ID).Error
	c.JSON(http.StatusOK, rp)
}

// ================= DELETE ==================
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

// ================= REPLY ==================
// POST /reports/:id/reply
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

	adminID, _ := strconv.Atoi(c.PostForm("admin_id"))
	text := strings.TrimSpace(c.PostForm("text"))

	// ✅ บันทึก reply แยกตาราง
	reply := entity.ProblemReply{
		ReportID: rp.ID,
		AdminID:  uint(adminID),
		Message:  text,
	}
	if err := db.Create(&reply).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ✅ แนบไฟล์กับ reply
	if form, _ := c.MultipartForm(); form != nil {
		files := form.File["attachments"]
		if len(files) > 0 {
			dir := filepath.Join("uploads", "replies", time.Now().Format("20060102"))
			_ = os.MkdirAll(dir, 0o755)
			for _, f := range files {
				name := fmt.Sprintf("%d_%s", time.Now().UnixNano(), f.Filename)
				dst := filepath.Join(dir, name)
				relPath := filepath.ToSlash(dst)

				if err := c.SaveUploadedFile(f, dst); err == nil {
					_ = db.Create(&entity.ProblemReplyAttachment{
						ReplyID:  reply.ID,
						FilePath: relPath,
					}).Error
				}
			}
		}
	}

	// ✅ Notification
	msg := text
	if msg == "" {
		msg = "แอดมินได้ตอบกลับคำร้องของคุณ"
	}
	var noti entity.Notification
	err := db.Where("user_id = ? AND type = ? AND report_id = ?", rp.UserID, "report_reply", rp.ID).
		First(&noti).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		_ = db.Create(&entity.Notification{
			Title:    fmt.Sprintf("ตอบกลับคำร้อง #%d", rp.ID),
			Message:  msg,
			Type:     "report_reply",
			UserID:   rp.UserID,
			ReportID: &rp.ID,
			IsRead:   false,
		}).Error
	} else if err == nil {
		noti.Message = msg
		noti.IsRead = false
		_ = db.Save(&noti).Error
	}

	// ✅ mark resolved
	now := time.Now()
	rp.Status = "resolved"
	rp.ResolvedAt = &now
	_ = db.Save(&rp).Error

	_ = db.Preload("User").
		Preload("Attachments").
		Preload("Replies.Attachments").
		First(&rp, rp.ID).Error

	c.JSON(http.StatusOK, rp)
}
