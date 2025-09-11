// controllers/payment_controller.go
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
	"gorm.io/gorm"
)

func baseURL(c *gin.Context) string {
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	return scheme + "://" + c.Request.Host
}

// ============================
// POST /payments
// multipart/form-data: order_id, file
// สร้างรายการชำระเงิน + อัปเดตคำสั่งซื้อเป็น UNDER_REVIEW
// ============================
func CreatePayment(c *gin.Context) {
	orderIDStr := c.PostForm("order_id")
	if orderIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id is required"})
		return
	}
	oid, err := strconv.Atoi(orderIDStr)
	if err != nil || oid <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order_id"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment slip file is required"})
		return
	}

	db := configs.DB()

	// โหลดออเดอร์
	var ord entity.Order
	if err := db.Preload("User").First(&ord, oid).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order not found"})
		return
	}

	// สร้างโฟลเดอร์อัปโหลดถ้ายังไม่มี
	_ = os.MkdirAll("uploads/slips", 0755)

	// ตั้งชื่อไฟล์ปลายทาง
	dstName := fmt.Sprintf("slips/order_%d_%d%s", ord.ID, time.Now().UnixNano(), filepath.Ext(file.Filename))
	dstPath := filepath.Join("uploads", dstName) // เก็บเป็น path ภายใน
	if err := c.SaveUploadedFile(file, dstPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save slip failed"})
		return
	}

	// ใช้ราคาออเดอร์ (ให้ฝั่ง server เป็น truth)
	amount := ord.TotalAmount

	p := entity.Payment{
		OrderID:      ord.ID,
		Amount:       amount,
		SlipPath:     dstName, // เก็บเฉพาะส่วนใต้ /uploads
		Status:       entity.PaymentStatus("PENDING"),
		RejectReason: nil,
		UploadedAt:   time.Now(),
	}

	// ใช้ transaction ป้องกันข้อมูลค้าง
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&p).Error; err != nil {
			return err
		}
		// อัปเดตสถานะออเดอร์ให้รอตรวจสอบ
		ord.OrderStatus = entity.OrderStatus("UNDER_REVIEW")
		if err := tx.Save(&ord).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create payment failed"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":           p.ID,
		"order_id":     p.OrderID,
		"amount":       p.Amount,
		"status":       string(p.Status),
		"reject_reason": p.RejectReason,
		"slip_url":     baseURL(c) + "/uploads/" + p.SlipPath,
		"uploaded_at":  p.UploadedAt,
	})
}

// ============================
// GET /payments?status=PENDING|APPROVED|REJECTED
// สำหรับหน้า AdminPaymentReview
// ============================
type adminPaymentDTO struct {
	ID          string  `json:"id"`
	OrderNo     string  `json:"order_no"`
	UserName    string  `json:"user_name"`
	Amount      float64 `json:"amount"`
	SlipURL     string  `json:"slip_url"`
	UploadedAt  string  `json:"uploaded_at"`
	Status      string  `json:"status"`
	RejectReason *string `json:"reject_reason,omitempty"`
	// จะส่งเพิ่มก็ได้ (ถ้าอยากใช้)
	OrderStatus string `json:"order_status,omitempty"`
}

func FindPayments(c *gin.Context) {
	db := configs.DB()
	statusQ := c.Query("status") // optional

	var rows []entity.Payment
	q := db.Preload("Order").Preload("Order.User").Order("uploaded_at DESC")
	if statusQ != "" {
		q = q.Where("status = ?", statusQ)
	}
	if err := q.Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query payments failed"})
		return
	}

	out := make([]adminPaymentDTO, 0, len(rows))
	for _, p := range rows {
		orderNo := fmt.Sprintf("ORD-%d", p.OrderID)
		userName := ""
		if p.Order.ID != 0 && p.Order.User.ID != 0 {
			userName = p.Order.User.Username
			if userName == "" {
				userName = fmt.Sprintf("User#%d", p.Order.User.ID)
			}
		}
		out = append(out, adminPaymentDTO{
			ID:           fmt.Sprintf("%d", p.ID),
			OrderNo:      orderNo,
			UserName:     userName,
			Amount:       p.Amount,
			SlipURL:      baseURL(c) + "/uploads/" + p.SlipPath,
			UploadedAt:   p.UploadedAt.Format(time.RFC3339),
			Status:       string(p.Status),                 // 👈 แปลงชนิด custom → string
			RejectReason: p.RejectReason,
			OrderStatus:  string(p.Order.OrderStatus),      // 👈 แปลงชนิด custom → string
		})
	}

	c.JSON(http.StatusOK, out)
}

// ============================
// PATCH /payments/:id
// body: { "status": "APPROVED" | "REJECTED", "reject_reason": "..."? }
// - อัปเดตสถานะ payment
// - ปรับสถานะ order ให้สอดคล้อง
// ============================
type patchPaymentBody struct {
	Status       *string `json:"status"`
	RejectReason *string `json:"reject_reason"`
}

func UpdatePayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var body patchPaymentBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
		return
	}
	if body.Status == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
		return
	}

	db := configs.DB()
	var p entity.Payment
	if err := db.Preload("Order").First(&p, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	newStatus := *body.Status
	switch newStatus {
	case "APPROVED":
		// อนุมัติ
		err = db.Transaction(func(tx *gorm.DB) error {
			p.Status = entity.PaymentStatus("APPROVED")
			p.RejectReason = nil
			if err := tx.Save(&p).Error; err != nil {
				return err
			}
			// อัปเดตคำสั่งซื้อให้ "PAID" (หรือ FULFILLED ถ้าคุณส่งมอบคีย์ทันที)
			p.Order.OrderStatus = entity.OrderStatus("PAID")
			if err := tx.Save(&p.Order).Error; err != nil {
				return err
			}
			// TODO: ถ้าต้องจ่ายคีย์เกม/เขียน UserGame ให้ทำใน transaction นี้
			return nil
		})
	case "REJECTED":
		err = db.Transaction(func(tx *gorm.DB) error {
			p.Status = entity.PaymentStatus("REJECTED")
			p.RejectReason = body.RejectReason // pointer → pointer (ไม่มีปัญหา)
			if err := tx.Save(&p).Error; err != nil {
				return err
			}
			// กลับไปสถานะเดิมให้ชัดเจน (แล้วแต่ธุรกิจคุณ จะ WAITING_PAYMENT หรือ CANCELLED)
			p.Order.OrderStatus = entity.OrderStatus("WAITING_PAYMENT")
			if err := tx.Save(&p.Order).Error; err != nil {
				return err
			}
			return nil
		})
	case "PENDING":
		err = db.Transaction(func(tx *gorm.DB) error {
			p.Status = entity.PaymentStatus("PENDING")
			// อนุญาตให้ล้างเหตุผลปฏิเสธ
			p.RejectReason = nil
			if err := tx.Save(&p).Error; err != nil {
				return err
			}
			p.Order.OrderStatus = entity.OrderStatus("UNDER_REVIEW")
			if err := tx.Save(&p.Order).Error; err != nil {
				return err
			}
			return nil
		})
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":            p.ID,
		"status":        string(p.Status),
		"reject_reason": p.RejectReason,
		"order_id":      p.OrderID,
		"order_status":  string(p.Order.OrderStatus),
	})
}

// ============================
// (ทางเลือก) ให้ /payments/:id/approve และ /payments/:id/reject
// ยังใช้งานได้ โดยเรียกใช้ UpdatePayment ภายใน
// ============================
func ApprovePayment(c *gin.Context) {
	c.Params = append(c.Params, gin.Param{Key: "status", Value: "APPROVED"})
	var body patchPaymentBody
	body.Status = strPtr("APPROVED")
	c.Set("forceBody", body)
	// เรียก UpdatePayment แบบจำลอง
	updateWithInjectedBody(c, body)
}

func RejectPayment(c *gin.Context) {
	var b struct {
		RejectReason *string `json:"reject_reason"`
	}
	if err := c.ShouldBindJSON(&b); err != nil {
		// ถ้าไม่ส่ง JSON มาก็ให้ reject แบบไม่มีเหตุผลได้ (เป็น nil)
	}
	body := patchPaymentBody{Status: strPtr("REJECTED"), RejectReason: b.RejectReason}
	updateWithInjectedBody(c, body)
}

// helper สำหรับเรียก UpdatePayment ด้วย body ที่เตรียมไว้
func updateWithInjectedBody(c *gin.Context, body patchPaymentBody) {
        // สร้าง context ใหม่ชั่วคราวเพื่อยัด body เข้าไป
        c.Request.Method = http.MethodPatch
        UpdatePayment(c.Copy())
}

func strPtr(s string) *string { return &s }
