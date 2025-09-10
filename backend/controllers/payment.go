package controllers

import (
	"errors"
	"math"
	"net/http"
	"os"
	"strings"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func CreatePayment(c *gin.Context) {
	user, err := authorize(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	var body entity.Payment
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	// ตรวจ Order
	var od entity.Order
	if tx := configs.DB().First(&od, body.OrderID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id not found"})
		return
	}
	if user.RoleID != 3 && od.UserID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	if body.PaymentDate.IsZero() {
		body.PaymentDate = time.Now()
	}
	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

// CreatePaymentWithGames สร้างออร์เดอร์และชำระเงินจากรายการเกมที่ส่งมา
func CreatePaymentWithGames(c *gin.Context) {
	user, err := authorize(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	var req struct {
		Games []struct {
			GameID   uint `json:"game_id" binding:"required"`
			Quantity int  `json:"quantity"`
		} `json:"games" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	db := configs.DB()

	now := time.Now()
	order := entity.Order{
		UserID:      user.ID,
		OrderCreate: now,
		OrderStatus: "PENDING",
	}
	if err := db.Create(&order).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, g := range req.Games {
		qty := g.Quantity
		if qty <= 0 {
			qty = 1
		}
		var game entity.Game
		if tx := db.First(&game, g.GameID); tx.RowsAffected == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "game_id not found"})
			return
		}

		unitPrice := float64(game.BasePrice)
		discount := 0.0

		var promos []entity.Promotion
		db.Joins("JOIN promotion_games pg ON pg.promotion_id = promotions.id").
			Where("pg.game_id = ? AND promotions.status = 1 AND promotions.start_date <= ? AND promotions.end_date >= ?", g.GameID, now, now).
			Find(&promos)
		for _, p := range promos {
			var d float64
			if p.DiscountType == entity.DiscountPercent {
				d = unitPrice * float64(p.DiscountValue) / 100
			} else if p.DiscountType == entity.DiscountAmount {
				d = float64(p.DiscountValue)
			}
			if d > discount {
				discount = d
			}
		}
		if discount > unitPrice {
			discount = unitPrice
		}
		lineDiscount := discount * float64(qty)
		lineTotal := (unitPrice - discount) * float64(qty)
		lineDiscount = math.Round(lineDiscount*100) / 100
		lineTotal = math.Round(lineTotal*100) / 100

		item := entity.OrderItem{
			UnitPrice:    unitPrice,
			QTY:          qty,
			LineDiscount: lineDiscount,
			LineTotal:    lineTotal,
			OrderID:      order.ID,
		}
		if err := db.Create(&item).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	total, err := updateOrderTotal(order.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	payment := entity.Payment{
		OrderID:     order.ID,
		PaymentDate: now,
		Status:      "PENDING",
		Amount:      total,
	}
	if err := db.Create(&payment).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db.Preload("OrderItems").First(&order, order.ID)

	c.JSON(http.StatusCreated, gin.H{"order": order, "payment": payment})
}

func FindPayments(c *gin.Context) {
	user, err := authorize(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	var rows []entity.Payment
	db := configs.DB().Preload("Order").Preload("PaymentSlips").Joins("JOIN orders ON orders.id = payments.order_id")
	orderID := c.Query("order_id")
	status := c.Query("status")
	if user.RoleID == 3 {
		if uid := c.Query("user_id"); uid != "" {
			db = db.Where("orders.user_id = ?", uid)
		}
	} else {
		db = db.Where("orders.user_id = ?", user.ID)
	}
	if orderID != "" {
		db = db.Where("order_id = ?", orderID)
	}
	if status != "" {
		db = db.Where("status = ?", status)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func UpdatePayment(c *gin.Context) {
	var payload entity.Payment
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := configs.DB()
	var row entity.Payment
	if tx := db.First(&row, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	if err := db.Model(&row).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

func DeletePayment(c *gin.Context) {
	// ลบสลิปที่เกี่ยวข้องก่อน
	db := configs.DB()
	db.Exec("DELETE FROM payment_slips WHERE payment_id = ?", c.Param("id"))
	if tx := db.Exec("DELETE FROM payments WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}

func authorizeAdmin(c *gin.Context) (*entity.User, error) {
	header := c.GetHeader("Authorization")
	if header == "" {
		return nil, errors.New("authorization header missing")
	}
	tokenString := strings.TrimPrefix(header, "Bearer ")
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret"
	}
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}
	sub, ok := claims["sub"].(float64)
	if !ok {
		return nil, errors.New("invalid subject")
	}
	var user entity.User
	if tx := configs.DB().First(&user, uint(sub)); tx.RowsAffected == 0 {
		return nil, errors.New("user not found")
	}
	if user.RoleID != 3 {
		return nil, errors.New("forbidden")
	}
	return &user, nil
}

func ApprovePayment(c *gin.Context) {
	if _, err := authorizeAdmin(c); err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		}
		return
	}
	var payment entity.Payment
	if tx := configs.DB().First(&payment, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	payment.Status = "APPROVED"
	payment.RejectReason = ""
	if err := configs.DB().Save(&payment).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payment)
}

func RejectPayment(c *gin.Context) {
	if _, err := authorizeAdmin(c); err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		}
		return
	}
	var payload struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var payment entity.Payment
	if tx := configs.DB().First(&payment, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	payment.Status = "REJECTED"
	payment.RejectReason = payload.Reason
	if err := configs.DB().Save(&payment).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payment)
}
