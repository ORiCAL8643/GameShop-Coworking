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
)

func CreatePaymentSlip(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	pidStr := c.PostForm("payment_id")
	if pidStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment_id is required"})
		return
	}
	pid, err := strconv.ParseUint(pidStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment_id"})
		return
	}
	var pm entity.Payment
	if tx := configs.DB().First(&pm, pid); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment_id not found"})
		return
	}
	uploadDir := filepath.Join("uploads", "payment_slips")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create directory"})
		return
	}
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename)
	filePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}
	slip := entity.PaymentSlip{
		PaymentID: uint(pid),
		FileURL:   filePath,
		UploadAt:  time.Now(),
	}
	if err := configs.DB().Create(&slip).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, slip)
}

func FindPaymentSlips(c *gin.Context) {
	var rows []entity.PaymentSlip
	db := configs.DB().Preload("Payment")
	paymentID := c.Query("payment_id")
	if paymentID != "" {
		db = db.Where("payment_id = ?", paymentID)
	}
	if err := db.Find(&rows).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func DeletePaymentSlip(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM payment_slips WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
