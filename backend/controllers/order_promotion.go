package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
    "example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

func CreateOrderPromotion(c *gin.Context) {
	var body entity.OrderPromotion
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}
	db := configs.DB()
	var od entity.Order
	if tx := db.First(&od, body.OrderID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id not found"})
		return
	}
	var pr entity.Promotion
	if tx := db.First(&pr, body.PromotionID); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "promotion_id not found"})
		return
	}
	if err := db.Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

func FindOrderPromotions(c *gin.Context) {
	var rows []entity.OrderPromotion
	db := configs.DB().Preload("Order").Preload("Promotion")
	oid := c.Query("order_id")
	if oid != "" {
		db = db.Where("order_id = ?", oid)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func DeleteOrderPromotion(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM order_promotions WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
