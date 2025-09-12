// backend/controllers/problem_report.go
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

// ===============================
// Reports
// ===============================

// POST /reports (multipart/form-data)
// fields: title, description, category, user_id, attachments[]
func CreateReport(c *gin.Context) {
	db := configs.DB()

	title := strings.TrimSpace(c.PostForm("title"))
	desc := strings.TrimSpace(c.PostForm("description"))
	category := strings.TrimSpace(c.PostForm("category"))
	status := strings.TrimSpace(c.PostForm("status"))
	if status == "" {
		status = "open"
	}

	// ✅ อ่าน user id จาก X-User-ID ก่อน แล้วค่อย fallback ไป form "user_id"
	uidStr := strings.TrimSpace(c.GetHeader("X-User-ID"))
	if uidStr == "" {
		uidStr = strings.TrimSpace(c.PostForm("user_id"))
	}
	userID, _ := strconv.Atoi(uidStr)

	if title == "" || desc == "" || userID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields (title, description, user_id)"})
		return
	}

	// ✅ SOFT-CHECK ผู้ใช้: ถ้าไม่พบก็ยังอนุญาตให้สร้างรายงานต่อได้ (กันเคส dev/test ที่ยังไม่มี record)
	if err := db.First(&entity.User{}, userID).Error; err != nil {
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		// ถ้า ErrRecordNotFound: ข้ามไป สร้างต่อได้เลย
	}

	// ❗ ไม่ใช้ game_id ในระบบนี้แล้ว

	report := entity.ProblemReport{
		Title:       title,
		Description: desc,
		Category:    category,
		Status:      status,
		UserID:      uint(userID),
	}

	if err := db.Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// แนบไฟล์ผู้ใช้ → uploads/reports/{reportID}/...
	if form, _ := c.MultipartForm(); form != nil {
		files := form.File["attachments"]
		if len(files) == 0 {
			files = form.File["file"]
		}
		if len(files) > 0 {
			dir := filepath.Join("uploads", "reports", fmt.Sprintf("%d", report.ID))
			_ = os.MkdirAll(dir, 0o755)
			for _, f := range files {
				name := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(f.Filename))
				dst := filepath.Join(dir, name)
				relPath := "/" + filepath.ToSlash(dst)

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

	// แจ้งเตือนแอดมินทุกคนว่ามีคำร้องใหม่
	notifyAdminsNewReport(db, &report)

	_ = db.
		Preload("User").
		Preload("Attachments").
		Preload("Replies").
		Preload("Replies.Admin").
		Preload("Replies.Attachments").
		First(&report, report.ID).Error

	c.JSON(http.StatusCreated, gin.H{"data": report})
}

// GET /reports?user_id=&game_id=&status=&page=&limit=
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
	if gameID > 0 {
		q = q.Where("game_id = ?", gameID)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}

	var items []entity.ProblemReport
	if err := q.
		Preload("User").
		Preload("Attachments").
		Preload("Replies").
		Preload("Replies.Admin").
		Preload("Replies.Attachments").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// GET /reports/:id
func GetReportByID(c *gin.Context) {
	db := configs.DB()
	id, _ := strconv.Atoi(c.Param("id"))

	var rp entity.ProblemReport
	if err := db.
		Preload("User").
		Preload("Attachments").
		Preload("Replies").
		Preload("Replies.Admin").
		Preload("Replies.Attachments").
		First(&rp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rp})
}

type updateReportInput struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Category    *string `json:"category,omitempty"`
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
	if in.Category != nil {
		rp.Category = strings.TrimSpace(*in.Category)
	}
	if in.Status != nil {
		rp.Status = strings.TrimSpace(*in.Status)
	}
	if in.Resolve != nil {
		if *in.Resolve {
			now := time.Now()
			rp.ResolvedAt = &now
			if rp.Status == "open" || rp.Status == "" {
				rp.Status = "resolved"
			}
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
	_ = db.
		Preload("User").
		Preload("Attachments").
		Preload("Replies").
		Preload("Replies.Admin").
		Preload("Replies.Attachments").
		First(&rp, rp.ID).Error
	c.JSON(http.StatusOK, gin.H{"data": rp})
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

// ===============================
// Admin Replies (แอดมินตอบกลับลูกค้า)
// ===============================

// POST /reports/:id/reply (multipart/form-data)
// fields: [admin_id], message หรือ text, attachments[]
// ใช้โดยหน้า AdminPage ฝั่งคุณ
func ReplyReport(c *gin.Context) {
	db := configs.DB()
	reportID, _ := strconv.Atoi(c.Param("id"))
	adminID, _ := strconv.Atoi(c.PostForm("admin_id")) // optional

	// ยอมรับทั้ง "message" หรือ "text"
	msg := strings.TrimSpace(c.PostForm("text"))
	if msg == "" {
		msg = strings.TrimSpace(c.PostForm("message"))
	}

	if reportID <= 0 || msg == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields"})
		return
	}

	reply, err := createReplyFlow(c, db, reportID, adminID, msg, /*autoResolve*/ true, /*requireAdmin*/ false)
	if err != nil {
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": reply})
}

// POST /admin/reports/:id/replies (multipart/form-data)
// fields: admin_id, message (หรือ text), attachments[]
func AdminCreateReply(c *gin.Context) {
	db := configs.DB()
	reportID, _ := strconv.Atoi(c.Param("id"))
	adminID, _ := strconv.Atoi(c.PostForm("admin_id"))

	// ยอมรับทั้ง "message" หรือ "text"
	msg := strings.TrimSpace(c.PostForm("message"))
	if msg == "" {
		msg = strings.TrimSpace(c.PostForm("text"))
	}

	if reportID <= 0 || adminID <= 0 || msg == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields"})
		return
	}

	reply, err := createReplyFlow(c, db, reportID, adminID, msg, /*autoResolve*/ false, /*requireAdmin*/ true)
	if err != nil {
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": reply})
}

// PATCH /admin/reports/:id/resolve
func AdminResolveReport(c *gin.Context) {
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

	now := time.Now()
	rp.Status = "resolved"
	rp.ResolvedAt = &now

	if err := db.Save(&rp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// แจ้งลูกค้าว่าปิดงานแล้ว
	makeOrUpdateUserReportNotification(db, rp.UserID, "report_resolved", uint(rp.ID), fmt.Sprintf("คำร้อง #%d ถูกปิดงานเรียบร้อย", rp.ID))

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"id": rp.ID, "status": rp.Status}})
}

// ===============================
// Helpers (Reply Flow + Notification)
// ===============================

func createReplyFlow(c *gin.Context, db *gorm.DB, reportID int, adminID int, msg string, autoResolve bool, requireAdmin bool) (*entity.ProblemReply, error) {
	// โหลด Report
	var report entity.ProblemReport
	if err := db.First(&report, reportID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
			return nil, err
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return nil, err
	}

	// require admin?
	if requireAdmin && adminID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing admin_id"})
		return nil, errors.New("missing admin_id")
	}

	// สร้าง Reply
	reply := entity.ProblemReply{
		ReportID: uint(reportID),
		Message:  msg,
	}
	if adminID > 0 {
		reply.AdminID = uint(adminID)
	}
	if err := db.Create(&reply).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return nil, err
	}

	// แนบไฟล์ → uploads/replies/{replyID}/...
	attachCount := 0
	if form, _ := c.MultipartForm(); form != nil {
		files := form.File["attachments"]
		if len(files) == 0 {
			files = form.File["file"]
		}
		if len(files) > 0 {
			attachCount = len(files)
			dir := filepath.Join("uploads", "replies", fmt.Sprintf("%d", reply.ID))
			_ = os.MkdirAll(dir, 0o755)
			for _, f := range files {
				name := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(f.Filename))
				dst := filepath.Join(dir, name)
				relPath := "/" + filepath.ToSlash(dst)

				if err := c.SaveUploadedFile(f, dst); err != nil {
					continue
				}
				_ = db.Create(&entity.ProblemReplyAttachment{
					ReplyID:  reply.ID,
					FilePath: relPath,
				}).Error
			}
		}
	}

	// สร้าง/อัปเดต Notification ให้ลูกค้า
	makeOrUpdateUserReportNotification(db, report.UserID, "report_reply", uint(report.ID), buildReplyMessage(msg, attachCount))

	// ปิดงานอัตโนมัติกรณี /reports/:id/reply
	if autoResolve {
		now := time.Now()
		report.Status = "resolved"
		report.ResolvedAt = &now
		_ = db.Save(&report).Error
	}

	_ = db.
		Preload("Admin").
		Preload("Attachments").
		First(&reply, reply.ID).Error

	return &reply, nil
}

func notifyAdminsNewReport(db *gorm.DB, report *entity.ProblemReport) {
	// เลือกผู้ใช้ที่เป็น Admin ทั้งหมด (สมมติว่ามี roles.name = 'Admin')
	type adminUser struct {
		ID   uint
		Name string
	}
	var admins []adminUser

	// หาก schema ของคุณไม่มี roles ให้ปรับส่วนนี้ให้เข้ากับของจริง
	db.Table("users").
		Joins("JOIN roles ON roles.id = users.role_id").
		Where("roles.name = ?", "Admin").
		Select("users.id, users.name").
		Scan(&admins)

	for _, a := range admins {
		_ = db.Create(&entity.Notification{
			Title:    "📩 มีคำร้องใหม่",
			Message:  fmt.Sprintf("%s: %s", strings.TrimSpace(report.Category), strings.TrimSpace(report.Title)),
			Type:     "report_new",
			UserID:   a.ID,       // ผู้รับ = แอดมิน
			ReportID: &report.ID, // อ้างอิงคำร้อง
			IsRead:   false,
		}).Error
	}
}

func makeOrUpdateUserReportNotification(db *gorm.DB, userID uint, typ string, reportID uint, msg string) {
	var noti entity.Notification
	err := db.Where("user_id = ? AND type = ? AND report_id = ?", userID, typ, reportID).
		First(&noti).Error

	title := ""
	switch typ {
	case "report_reply":
		title = fmt.Sprintf("ตอบกลับคำร้อง #%d", reportID)
	case "report_resolved":
		title = fmt.Sprintf("ปิดงานคำร้อง #%d", reportID)
	default:
		title = "การแจ้งเตือนคำร้อง"
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		_ = db.Create(&entity.Notification{
			Title:    title,
			Message:  msg,
			Type:     typ,
			UserID:   userID,
			ReportID: &reportID,
			IsRead:   false,
		}).Error
		return
	}
	if err == nil {
		noti.Title = title
		noti.Message = msg
		noti.IsRead = false
		_ = db.Save(&noti).Error
	}
}

func buildReplyMessage(msg string, attachCount int) string {
	if msg == "" && attachCount > 0 {
		return "แอดมินได้ตอบกลับพร้อมไฟล์แนบ"
	}
	if msg != "" && attachCount > 0 {
		return fmt.Sprintf("%s (แนบไฟล์ %d ไฟล์)", msg, attachCount)
	}
	if msg != "" {
		return msg
	}
	return "แอดมินได้ตอบกลับคำร้องของคุณ"
}
