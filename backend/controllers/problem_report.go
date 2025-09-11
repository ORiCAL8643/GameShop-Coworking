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

// POST /reports
// Create a new problem report from user. Supports file attachments via
// multipart/form-data with field name "attachments".
func CreateReport(c *gin.Context) {
	db := configs.DB()

	title := strings.TrimSpace(c.PostForm("title"))
	desc := strings.TrimSpace(c.PostForm("description"))
	category := strings.TrimSpace(c.PostForm("category"))
	userID, _ := strconv.Atoi(c.PostForm("user_id"))

	if title == "" || desc == "" || category == "" || userID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields"})
		return
	}

	// ensure user exists
	var u entity.User
	if err := db.First(&u, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	rp := entity.ProblemReport{
		Title:       title,
		Description: desc,
		Category:    category,
		Status:      "pending",
		UserID:      uint(userID),
	}
	if err := db.Create(&rp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// attachments
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
				rel := filepath.ToSlash(filepath.Join("uploads", "reports", time.Now().Format("20060102"), name))
				if err := c.SaveUploadedFile(f, dst); err == nil {
					db.Create(&entity.ProblemAttachment{FilePath: rel, ReportID: rp.ID})
				}
			}
		}
	}

	db.Preload("Attachments").Preload("Replies.Attachments").First(&rp, rp.ID)
	c.JSON(http.StatusCreated, rp)
}

// GET /reports - list all pending reports
func GetPendingReports(c *gin.Context) {
	var items []entity.ProblemReport
	if err := configs.DB().Where("status = ?", "pending").
		Preload("Attachments").
		Preload("Replies.Attachments").
		Order("created_at DESC").
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GET /reports/resolved - list resolved reports
func GetResolvedReports(c *gin.Context) {
	var items []entity.ProblemReport
	if err := configs.DB().Where("status = ?", "resolved").
		Preload("Attachments").
		Preload("Replies.Attachments").
		Order("updated_at DESC").
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GET /reports/:id - get single report with attachments and replies
func GetReportByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var rp entity.ProblemReport
	if err := configs.DB().
		Preload("Attachments").
		Preload("Replies.Attachments").
		First(&rp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, rp)
}

// POST /reports/:id/reply - admin replies to a report (text + optional files)
func ReplyReport(c *gin.Context) {
	db := configs.DB()
	id, _ := strconv.Atoi(c.Param("id"))

	var rp entity.ProblemReport
	if err := db.First(&rp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	adminID, _ := strconv.Atoi(c.PostForm("admin_id"))
	msg := strings.TrimSpace(c.PostForm("message"))
	form, _ := c.MultipartForm()
	if adminID <= 0 && msg == "" && (form == nil || (len(form.File["attachments"]) == 0 && len(form.File["file"]) == 0)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid reply"})
		return
	}

	reply := entity.ProblemReply{
		ReportID: rp.ID,
		AdminID:  uint(adminID),
		Message:  msg,
	}
	if err := db.Create(&reply).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if form != nil {
		files := form.File["attachments"]
		if len(files) == 0 {
			files = form.File["file"]
		}
		if len(files) > 0 {
			dir := filepath.Join("uploads", "replies", time.Now().Format("20060102"))
			_ = os.MkdirAll(dir, 0o755)
			for _, f := range files {
				name := fmt.Sprintf("%d_%s", time.Now().UnixNano(), f.Filename)
				dst := filepath.Join(dir, name)
				rel := filepath.ToSlash(filepath.Join("uploads", "replies", time.Now().Format("20060102"), name))
				if err := c.SaveUploadedFile(f, dst); err == nil {
					db.Create(&entity.ProblemReplyAttachment{FilePath: rel, ReplyID: reply.ID})
				}
			}
		}
	}

	// create notification for user
	msgNoti := msg
	if msgNoti == "" {
		msgNoti = "มีการตอบกลับจากผู้ดูแล"
	}
	_ = db.Create(&entity.Notification{
		Title:    fmt.Sprintf("ตอบกลับคำร้อง #%d", rp.ID),
		Message:  msgNoti,
		Type:     "report_reply",
		UserID:   rp.UserID,
		ReportID: &rp.ID,
	}).Error

	db.Preload("Attachments").Preload("Replies.Attachments").First(&rp, rp.ID)
	c.JSON(http.StatusOK, rp)
}

// PUT /reports/:id/resolve - mark report as resolved
func ResolveReport(c *gin.Context) {
	db := configs.DB()
	id, _ := strconv.Atoi(c.Param("id"))

	var rp entity.ProblemReport
	if err := db.First(&rp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	now := time.Now()
	rp.Status = "resolved"
	rp.ResolvedAt = &now
	if err := db.Save(&rp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	db.Preload("Attachments").Preload("Replies.Attachments").First(&rp, rp.ID)
	c.JSON(http.StatusOK, rp)
}

// DELETE /reports/:id
func DeleteReport(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := configs.DB().Delete(&entity.ProblemReport{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
