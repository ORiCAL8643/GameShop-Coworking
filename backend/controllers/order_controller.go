// backend/controllers/order_controller.go
package controllers

import (

	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)



// ดึงราคาหลังโปรจริง ๆ ให้ไปเติม logic preload promotion ที่นี่ถ้ามี
func getDiscountedPriceForGame(db *gorm.DB, gameID uint, now time.Time) (float64, error) {
	var g entity.Game
	if err := db.First(&g, gameID).Error; err != nil {
		return 0, err
	}
	return float64(g.BasePrice), nil
}

type CreateOrderItemInput struct {
	GameID uint `json:"game_id" binding:"required"`
	QTY    int  `json:"qty" binding:"required"`
}
type CreateOrderInput struct {
	// ไม่รับ user_id จาก client เพื่อกันสวมรอย
	Items []CreateOrderItemInput `json:"items" binding:"required"`
}

// POST /orders  (ต้อง Auth) — ผูกกับ user จาก token เสมอ
func CreateOrder(c *gin.Context) {
	uidAny, _ := c.Get("userID")
	userID, _ := uidAny.(uint)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var body CreateOrderInput
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	db := configs.DB()
	now := time.Now()

	order := entity.Order{
		UserID:      userID,
		OrderCreate: now,
		OrderStatus: entity.OrderWaitingPayment,
	}

	total := 0.0
	items := make([]entity.OrderItem, 0, len(body.Items))
	for _, it := range body.Items {
		qty := it.QTY
		if qty <= 0 {
			qty = 1
		}
		unit, err := getDiscountedPriceForGame(db, it.GameID, now)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "game not found"})
			return
		}
		line := round2(unit * float64(qty))
		items = append(items, entity.OrderItem{
			GameID:       it.GameID,
			QTY:          qty,
			UnitPrice:    round2(unit),
			LineDiscount: 0,
			LineTotal:    line,
		})
		total += line
	}
	order.TotalAmount = round2(total)
	order.OrderItems = items

	if err := db.Create(&order).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_ = db.Preload("OrderItems").Preload("User").First(&order, order.ID)
	c.JSON(http.StatusOK, order)
}

// GET /orders  (ต้อง Auth)
// - ถ้า query: ?mine=1 หรือไม่ส่งอะไรเลย -> คืนของ user ที่ล็อกอิน
// - ถ้า admin ส่ง ?user_id=... ได้
func FindOrders(c *gin.Context) {
	uid := c.MustGet("userID").(uint)
	db := configs.DB().Preload("User").Preload("OrderItems").Preload("Payments")

	var rows []entity.Order

	// is admin?
	roleAny, _ := c.Get("roleID")
	isAdmin := roleAny != nil && roleAny.(uint) == configs.AdminRoleID()

	userID := c.Query("user_id")
	mine := c.Query("mine")

	switch {
	case isAdmin && userID != "":
		db = db.Where("user_id = ?", userID)
	case mine == "1" || userID == "":
		db = db.Where("user_id = ?", uid)
	default:
		// กันกรณี client ยัด user_id ของคนอื่น (แต่ไม่ใช่ admin)
		db = db.Where("user_id = ?", uid)
	}

	if st := c.Query("status"); st != "" {
		db = db.Where("order_status = ?", st)
	}

	if err := db.Order("id desc").Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, rows)
}

// GET /orders/:id  (ต้อง Auth) — เจ้าของหรือแอดมินเท่านั้น
func FindOrderByID(c *gin.Context) {
	uid := c.MustGet("userID").(uint)
	roleAny, _ := c.Get("roleID")
	isAdmin := roleAny != nil && roleAny.(uint) == configs.AdminRoleID()

	var order entity.Order
	if tx := configs.DB().Preload("User").Preload("OrderItems").Preload("Payments").First(&order, c.Param("id")); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	if !isAdmin && order.UserID != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	c.JSON(http.StatusOK, order)
}

// (ถ้ามี Update/Delete เดิมอยู่ ให้คงไว้ตามต้องการ แต่ควรก็ตรวจ owner เช่นกัน)
