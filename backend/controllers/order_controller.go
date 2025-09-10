// controllers/order_controller.go
package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"example.com/sa-gameshop/services"
	"github.com/gin-gonic/gin"
)

type CreateOrderItemInput struct {
	GameID uint `json:"game_id"`
	QTY    int  `json:"qty"`
}
type CreateOrderInput struct {
	UserID uint                   `json:"user_id"`
	Items  []CreateOrderItemInput `json:"items"`
}

func CreateOrder(c *gin.Context) {
	var body CreateOrderInput
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Items) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	db := configs.DB()
	now := time.Now()
	order := entity.Order{
		UserID:      body.UserID,
		OrderCreate: now,
		OrderStatus: entity.OrderWaitingPayment,
	}

	total := 0.0
	items := make([]entity.OrderItem, 0, len(body.Items))
	for _, it := range body.Items {
		if it.QTY <= 0 {
			it.QTY = 1
		}
		unit, err := services.GetDiscountedPriceForGame(db, it.GameID, now)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "game not found"})
			return
		}
		line := unit * float64(it.QTY)
		items = append(items, entity.OrderItem{
			GameID:       it.GameID,
			QTY:          it.QTY,
			UnitPrice:    unit,
			LineDiscount: 0,
			LineTotal:    line,
		})
		total += line
	}
	order.TotalAmount = total
	order.OrderItems = items

	if err := db.Create(&order).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_ = db.Preload("OrderItems").Preload("User").First(&order, order.ID)
	c.JSON(http.StatusOK, order)
}

func FindOrders(c *gin.Context) {
	db := configs.DB().Preload("User").Preload("OrderItems").Preload("Payments")
	var rows []entity.Order

	if uid := c.Query("user_id"); uid != "" {
		db = db.Where("user_id = ?", uid)
	}
	if st := c.Query("status"); st != "" {
		db = db.Where("order_status = ?", st)
	}

	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func GetOrder(c *gin.Context) {
	var order entity.Order
	if tx := configs.DB().Preload("User").Preload("OrderItems").Preload("Payments").First(&order, c.Param("id")); tx.Error != nil || tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	c.JSON(http.StatusOK, order)
}
