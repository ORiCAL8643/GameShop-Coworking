package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /problem-reports
func CreateProblemReport(c *gin.Context) {
	var body entity.ProblemReport
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
		return
	}

	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, body)
}

// GET /problem-reports
// optional: ?user_id=... / ?game_id=... / ?status=...
func FindProblemReports(c *gin.Context) {
	var reports []entity.ProblemReport
	db := configs.DB()

	userID := c.Query("user_id")
	gameID := c.Query("game_id")
	status := c.Query("status")

	tx := db.Model(&entity.ProblemReport{}).Preload("Attachments")
	if userID != "" {
		tx = tx.Where("user_id = ?", userID)
	}
	if gameID != "" {
		tx = tx.Where("game_id = ?", gameID)
	}
	if status != "" {
		tx = tx.Where("status = ?", status)
	}

	if err := tx.Find(&reports).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reports)
}

// GET /problem-reports/:id
func FindProblemReportByID(c *gin.Context) {
	var report entity.ProblemReport
	if tx := configs.DB().Preload("Attachments").First(&report, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, report)
}

// PUT /problem-reports/:id
func UpdateProblemReport(c *gin.Context) {
	var payload entity.ProblemReport
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var report entity.ProblemReport
	db := configs.DB()
	if tx := db.First(&report, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}

	if err := db.Model(&report).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

// DELETE /problem-reports/:id
func DeleteProblemReportByID(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM problem_reports WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
