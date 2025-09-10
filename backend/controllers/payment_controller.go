// backend/controllers/payment_controller.go
package controllers

import (
	"fmt"
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /payments  (multipart: order_id, file)  ต้อง Auth + เป็นเจ้าของออเดอร์
func CreatePayment(c *gin.Context) {
	uid := c.MustGet("userID").(uint)

	orderID := c.PostForm("order_id")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id required"})
		return
	}

	var order entity.Order
	if tx := configs.DB().Preload("OrderItems").First(&order, orderID); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	if order.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slip file required"})
		return
	}
	savePath := fmt.Sprintf("uploads/slips/%d_%s", time.Now().Unix(), file.Filename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save slip failed"})
		return
	}

	pay := entity.Payment{
		OrderID:        order.ID,
		Amount:         order.TotalAmount,
		Status:         entity.PaymentSubmitted,
		PaymentDate:    time.Now(),
		SlipURL:        "/" + savePath,
		SlipUploadedAt: time.Now(),
	}
	if err := configs.DB().Create(&pay).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = configs.DB().Model(&entity.Order{}).Where("id = ?", order.ID).
		Update("order_status", entity.OrderUnderReview)

	c.JSON(http.StatusOK, gin.H{"payment": pay})
}

type rejectInput struct{ Reason string `json:"reason"` }

// POST /payments/:id/approve  (Admin)
func ApprovePayment(c *gin.Context) {
	// … (โค้ดอนุมัติเหมือนเดิมของคุณ)
	// ไม่ต้องแก้ตรรกะจ่ายคีย์/เพิ่ม user_game ถ้าเดิมใช้ได้แล้ว
}

// POST /payments/:id/reject  (Admin)
func RejectPayment(c *gin.Context) {
	// … (ตรรกะเดิม)
}

// GET /payments  (ต้อง Auth) — คืนเฉพาะ payment ของ order ที่เป็นของ user นี้
func FindPayments(c *gin.Context) {
	uid := c.MustGet("userID").(uint)
	db := configs.DB().Joins("JOIN orders o ON o.id = payments.order_id").
		Where("o.user_id = ?", uid).
		Order("payments.id desc")

	var rows []entity.Payment
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, rows)
}
