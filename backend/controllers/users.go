package controllers

import (
	"net/http"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// POST /users
func CreateUser(c *gin.Context) {
	var req struct {
		Username  string `json:"username"`
		Password  string `json:"password"`
		Email     string `json:"email"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Birthday  string `json:"birthday"`
		RoleID    uint   `json:"role_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request body"})
		return
	}

	birthday, err := time.Parse("2006-01-02", req.Birthday)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid birthday format"})
		return
	}

	body := entity.User{
		Username:  req.Username,
		Password:  req.Password,
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Birthday:  birthday,
		RoleID:    req.RoleID,
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}
	body.Password = string(hashedPassword)

	if err := configs.DB().Create(&body).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	body.Password = ""
	c.JSON(http.StatusCreated, body)
}

// GET /users
// optional: ?username=... / ?email=...
func FindUsers(c *gin.Context) {
	var users []entity.User
	db := configs.DB()

	username := c.Query("username")
	email := c.Query("email")
	roleID := c.Query("role_id")
	tx := db.Model(&entity.User{})
	if username != "" {
		tx = tx.Where("username = ?", username)
	}
	if email != "" {
		tx = tx.Where("email = ?", email)
	}
	if roleID != "" {
		tx = tx.Where("role_id = ?", roleID)
	}
	if err := tx.Find(&users).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

// GET /users/:id
func FindUserByID(c *gin.Context) {
	var user entity.User
	if tx := configs.DB().Preload("Requests").First(&user, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// PUT /users/:id
func UpdateUser(c *gin.Context) {
	var payload entity.User
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	db := configs.DB()
	if tx := db.First(&user, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
		return
	}
	if err := db.Model(&user).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated successful"})
}
// PATCH /users/:id/role
func UpdateUserRole(c *gin.Context) {
	var body struct {
		RoleID uint `json:"role_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	if tx := configs.DB().First(&user, c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	user.RoleID = body.RoleID
	if err := configs.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, user)
}


// DELETE /users/:id
func DeleteUserByID(c *gin.Context) {
	if tx := configs.DB().Exec("DELETE FROM users WHERE id = ?", c.Param("id")); tx.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted successful"})
}
