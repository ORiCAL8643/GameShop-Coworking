package controllers

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
)

// POST /problem-attachments
func CreateProblemAttachment(c *gin.Context) {
	var body entity.ProblemAttachment
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

// GET /problem-attachments
// optional: ?report_id=...
func FindProblemAttachments(c *gin.Context) {
	var attachments []entity.ProblemAttachment
	db := configs.DB()

	reportID := c.Query("report_id")
	tx := db.Model(&entity.ProblemAttachment{})
	if reportID != "" {
		tx = tx.Where("report_id = ?", reportID)
	}
	if err := tx.Find(&attachments).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, attachments)
}

// GET /problem-attachments/:id
func FindProblemAttachmentByID(c *gin.Context) {
	var attachment entity.ProblemAttachment
	if tx := configs.DB().First(&attachment, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, attachment)
}

// PUT /problem-attachments/:id
func UpdateProblemAttachment(c *gin.Context) {
	var payload entity.ProblemAttachment
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var attachment entity.ProblemAttachment
	db := configs.DB()
	if tx := db.First(&attachment, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}

	if err := db.Model(&attachment).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}

// DELETE /problem-attachments/:id
func DeleteProblemAttachmentByID(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM problem_attachments WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
