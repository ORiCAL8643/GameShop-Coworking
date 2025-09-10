package controllers

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "os"
    "testing"
    "time"

    "example.com/sa-gameshop/configs"
    "example.com/sa-gameshop/entity"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

func TestCreateOrderTotalAmountIgnored(t *testing.T) {
    os.Setenv("DB_PATH", "file::memory:?cache=shared")
    configs.ConnectionDB()
    db := configs.DB()
    if err := db.AutoMigrate(&entity.User{}, &entity.Order{}); err != nil {
        t.Fatalf("migrate failed: %v", err)
    }

    user := entity.User{Username: "tester"}
    if err := db.Create(&user).Error; err != nil {
        t.Fatalf("create user: %v", err)
    }

    gin.SetMode(gin.TestMode)
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)

    payload := map[string]interface{}{
        "total_amount": 999,
    }
    b, _ := json.Marshal(payload)
    req := httptest.NewRequest(http.MethodPost, "/orders", bytes.NewReader(b))
    req.Header.Set("Content-Type", "application/json")
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"sub": float64(user.ID), "exp": time.Now().Add(time.Hour).Unix()})
    tokenString, _ := token.SignedString([]byte("secret"))
    req.Header.Set("Authorization", "Bearer "+tokenString)

    c.Request = req

    CreateOrder(c)

    if w.Code != http.StatusCreated {
        t.Fatalf("expected status 201, got %d", w.Code)
    }
    var resp entity.Order
    if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
        t.Fatalf("invalid response: %v", err)
    }
    if resp.TotalAmount != 0 {
        t.Fatalf("total_amount should be 0, got %v", resp.TotalAmount)
    }
}

