// controllers/payment_controller.go
package controllers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /payments (multipart/form-data: order_id, file)
func CreatePayment(c *gin.Context) {
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

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slip file required"})
		return
	}
	_ = os.MkdirAll("uploads/slips", 0755)
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
	_ = configs.DB().Model(&entity.Order{}).Where("id = ?", order.ID).Update("order_status", entity.OrderUnderReview)
	c.JSON(http.StatusOK, gin.H{"payment": pay})
}

// POST /payments/:id/approve
func ApprovePayment(c *gin.Context) {
	var pay entity.Payment
	if tx := configs.DB().Preload("Order").First(&pay, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}
	if pay.Status == entity.PaymentApproved {
		c.JSON(http.StatusBadRequest, gin.H{"error": "already approved"})
		return
	}

	now := time.Now()
	pay.Status = entity.PaymentApproved
	pay.ReviewedAt = &now
	if err := configs.DB().Save(&pay).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_ = configs.DB().Model(&entity.Order{}).Where("id = ?", pay.OrderID).Update("order_status", entity.OrderPaid)

	// ดึงรายการ order items
	var items []entity.OrderItem
	if err := configs.DB().Where("order_id = ?", pay.OrderID).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load order items failed"})
		return
	}

	// สำหรับแต่ละแถว: เบิกคีย์ว่าง
	for _, it := range items {
		need := it.QTY
		if need <= 0 {
			continue
		}
		var freeKeys []entity.KeyGame
		if err := configs.DB().
			Where("game_id = ? AND owned_by_order_item_id IS NULL", it.GameID).
			Limit(need).
			Find(&freeKeys).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch free keys failed"})
			return
		}
		if len(freeKeys) < need {
			c.JSON(http.StatusConflict, gin.H{
				"error":         "insufficient key stock",
				"game_id":       it.GameID,
				"required_qty":  need,
				"available_qty": len(freeKeys),
			})
			return
		}
		for i := 0; i < need; i++ {
			k := freeKeys[i]
			k.OwnedByOrderItemID = &it.ID
			if err := configs.DB().Save(&k).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "assign key failed"})
				return
			}
		}
	}

	// เพิ่มสิทธิ์เกมให้ผู้ใช้ (1 แถว/เกม)
	for _, it := range items {
		ug := entity.UserGame{
			UserID:             pay.Order.UserID,
			GameID:             it.GameID,
			GrantedAt:          time.Now(),
			GrantedByPaymentID: pay.ID,
		}
		_ = configs.DB().Clauses().Create(&ug).Error // DoNothing ได้ถ้าตั้ง unique
	}

	_ = configs.DB().Model(&entity.Order{}).Where("id = ?", pay.OrderID).Update("order_status", entity.OrderFulfilled)
	c.JSON(http.StatusOK, gin.H{"message": "payment approved, keys delivered, user granted"})
}

type rejectInput struct{ Reason string `json:"reason"` }

func RejectPayment(c *gin.Context) {
	var body rejectInput
	if err := c.ShouldBindJSON(&body); err != nil || body.Reason == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reject reason required"})
		return
	}
	var pay entity.Payment
	if tx := configs.DB().First(&pay, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}
	now := time.Now()
	pay.Status = entity.PaymentRejected
	pay.ReviewedAt = &now
	pay.RejectReason = body.Reason
	if err := configs.DB().Save(&pay).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_ = configs.DB().Model(&entity.Order{}).Where("id = ?", pay.OrderID).Update("order_status", entity.OrderWaitingPayment)
	c.JSON(http.StatusOK, pay)
}

func FindPayments(c *gin.Context) {
	db := configs.DB()
	if oid := c.Query("order_id"); oid != "" {
		db = db.Where("order_id = ?", oid)
	}
	var rows []entity.Payment
	if err := db.Order("id DESC").Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, rows)
}
