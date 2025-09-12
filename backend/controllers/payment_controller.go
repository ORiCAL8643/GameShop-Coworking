// controllers/payment_controller.go
package controllers

import (
	"errors"
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

var (
	ErrNotEnoughKeys   = errors.New("not enough keys")
	ErrAlreadyApproved = errors.New("payment already approved")
)

func baseURL(c *gin.Context) string {
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	return scheme + "://" + c.Request.Host
}

// ============================
// POST /payments  (multipart/form-data: order_id, file)
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
	dstPath := filepath.Join("uploads", dstName) // เก็บเป็น path ภายใน เช่น uploads/slips/...
	if err := c.SaveUploadedFile(file, dstPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save slip failed"})
		return
	}

	// ใช้ราคาออเดอร์จากฝั่ง server
	amount := ord.TotalAmount

	p := entity.Payment{
		OrderID:      ord.ID,
		Amount:       amount,
		SlipPath:     dstName, // เก็บเฉพาะส่วนใต้ /uploads
		Status:       entity.PaymentStatus("PENDING"),
		RejectReason: nil,
		// ไม่ต้องมี UploadedAt เพราะ gorm.Model มี CreatedAt ให้อยู่แล้ว
	}

	// ใช้ transaction
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
		"id":            p.ID,
		"order_id":      p.OrderID,
		"amount":        p.Amount,
		"status":        string(p.Status),
		"reject_reason": p.RejectReason,
		"slip_url":      baseURL(c) + "/uploads/" + p.SlipPath,
		"uploaded_at":   p.CreatedAt, // ใช้ CreatedAt แทน
	})
}

// ============================
// GET /payments?status=PENDING|APPROVED|REJECTED
// สำหรับหน้า AdminPaymentReview
// ============================
type adminPaymentDTO struct {
	ID           string  `json:"id"`
	OrderNo      string  `json:"order_no"`
	UserName     string  `json:"user_name"`
	Amount       float64 `json:"amount"`
	SlipURL      string  `json:"slip_url"`
	UploadedAt   string  `json:"uploaded_at"`
	Status       string  `json:"status"`
	RejectReason *string `json:"reject_reason,omitempty"`
	// จะส่งเพิ่มก็ได้
	OrderStatus string `json:"order_status,omitempty"`
}

func FindPayments(c *gin.Context) {
	db := configs.DB()
	statusQ := c.Query("status") // optional

	var rows []entity.Payment
	q := db.Preload("Order").Preload("Order.User").Order("created_at DESC")
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
			UploadedAt:   p.CreatedAt.Format(time.RFC3339), // ใช้ CreatedAt
			Status:       string(p.Status),
			RejectReason: p.RejectReason,
			OrderStatus:  string(p.Order.OrderStatus),
		})
	}

	c.JSON(http.StatusOK, out)
}

// ============================
// PATCH /payments/:id
// body: { "status": "APPROVED" | "REJECTED" | "PENDING", "reject_reason": "..."? }
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

	if err := changePaymentStatus(uint(id), *body.Status, body.RejectReason); err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
			return
		case errors.Is(err, ErrAlreadyApproved):
			c.JSON(http.StatusConflict, gin.H{"error": "payment already approved"})
			return
		case errors.Is(err, ErrNotEnoughKeys):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// โหลดล่าสุดเพื่อส่งกลับ
	var p entity.Payment
	if err := configs.DB().Preload("Order").First(&p, id).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "updated"}) // fallback
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
// ACTION endpoints (เรียกใช้ helper โดยตรง)
// POST /payments/:id/approve
// POST /payments/:id/reject   (body: {"reject_reason":"..."} optional)
// ============================
func ApprovePayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := changePaymentStatus(uint(id), "APPROVED", nil); err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
			return
		case errors.Is(err, ErrAlreadyApproved):
			c.JSON(http.StatusConflict, gin.H{"error": "payment already approved"})
			return
		case errors.Is(err, ErrNotEnoughKeys):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "approved"})
}

func RejectPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var b struct {
		RejectReason *string `json:"reject_reason"`
	}
	_ = c.ShouldBindJSON(&b) // อนุญาตให้ว่างได้

	if err := changePaymentStatus(uint(id), "REJECTED", b.RejectReason); err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reject failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "rejected"})
}

// ============================
// helper: เปลี่ยนสถานะ payment + sync order
// ============================
func changePaymentStatus(paymentID uint, newStatus string, rejectReason *string) error {
	db := configs.DB()

	var p entity.Payment
	if err := db.Preload("Order").Preload("Order.OrderItems").First(&p, paymentID).Error; err != nil {
		return err
	}

	if newStatus == "APPROVED" && p.Status == entity.PaymentStatus("APPROVED") {
		return ErrAlreadyApproved
	}

	return db.Transaction(func(tx *gorm.DB) error {
		switch newStatus {
		case "APPROVED":
			p.Status = entity.PaymentStatus("APPROVED")
			p.RejectReason = nil
			if err := tx.Save(&p).Error; err != nil {
				return err
			}
			p.Order.OrderStatus = entity.OrderStatus("PAID")
			if err := tx.Save(&p.Order).Error; err != nil {
				return err
			}

			// Allocate game keys and grant games to user
			for _, item := range p.Order.OrderItems {
				var keys []entity.KeyGame
				if err := tx.Where("game_id = ? AND owned_by_order_item_id IS NULL", item.GameID).
					Limit(item.QTY).Find(&keys).Error; err != nil {
					return fmt.Errorf("find keys failed: %w", err)
				}
				if len(keys) < item.QTY {
					return fmt.Errorf("%w: game %d", ErrNotEnoughKeys, item.GameID)
				}
				for _, k := range keys {
					k.OwnedByOrderItemID = &item.ID
					if err := tx.Save(&k).Error; err != nil {
						return fmt.Errorf("save key failed: %w", err)
					}
					ug := entity.UserGame{
						UserID:             p.Order.UserID,
						GameID:             item.GameID,
						GrantedByPaymentID: p.ID,
						GrantedAt:          time.Now(),
					}
					if err := tx.Create(&ug).Error; err != nil {
						return fmt.Errorf("create user_game failed: %w", err)
					}
				}
			}

			return nil

		case "REJECTED":
			p.Status = entity.PaymentStatus("REJECTED")
			p.RejectReason = rejectReason
			if err := tx.Save(&p).Error; err != nil {
				return err
			}
			p.Order.OrderStatus = entity.OrderStatus("WAITING_PAYMENT")
			if err := tx.Save(&p.Order).Error; err != nil {
				return err
			}
			return nil

		case "PENDING":
			p.Status = entity.PaymentStatus("PENDING")
			p.RejectReason = nil
			if err := tx.Save(&p).Error; err != nil {
				return err
			}
			p.Order.OrderStatus = entity.OrderStatus("UNDER_REVIEW")
			if err := tx.Save(&p.Order).Error; err != nil {
				return err
			}
			return nil

		default:
			return fmt.Errorf("invalid status: %s", newStatus)
		}
	})
}
