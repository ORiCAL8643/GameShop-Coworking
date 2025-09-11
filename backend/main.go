// main.go
package main

import (
	"net/http"
	"os"
	"strconv"
	"strings"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/controllers"
	"example.com/sa-gameshop/entity"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const PORT = "8088"

func main() {
	// 1) DB connect + migrate/seed
	configs.ConnectionDB()
	configs.SetupDatabase()

	r := gin.Default()

	// 2) Static & CORS
	r.Static("/uploads", "./uploads")
	r.Use(CORSMiddleware())

	// 3) health check
	r.GET("/ping", func(c *gin.Context) { c.String(http.StatusOK, "pong") })

	// 4) กลุ่มเส้นทางหลัก (public)
	router := r.Group("/")
	{
		// -------- Auth --------
		router.POST("/login", controllers.Login)

		// -------- Users --------
		router.POST("/users", controllers.CreateUser)
		router.GET("/users", controllers.FindUsers)
		router.GET("/users/:id", controllers.FindUserByID)
		router.PUT("/users/:id", controllers.UpdateUser)
		router.DELETE("/users/:id", controllers.DeleteUserByID)
		router.PATCH("/users/:id/role", controllers.UpdateUserRole)

		// -------- Roles --------
		router.GET("/roles", controllers.GetRoles)
		router.GET("/roles/:id", controllers.GetRoleById)
		router.POST("/roles", controllers.CreateRole)
		router.PATCH("/roles/:id", controllers.UpdateRole)
		router.DELETE("/roles/:id", controllers.DeleteRole)

		// -------- Permissions --------
		router.GET("/permissions", controllers.GetPermissions)
		router.GET("/permissions/:id", controllers.GetPermissionById)
		router.POST("/permissions", controllers.CreatePermission)
		router.PATCH("/permissions/:id", controllers.UpdatePermission)
		router.DELETE("/permissions/:id", controllers.DeletePermission)

		// -------- RolePermissions --------
		router.GET("/rolepermissions", controllers.GetRolePermissions)
		router.GET("/rolepermissions/:id", controllers.GetRolePermissionById)
		router.POST("/rolepermissions", controllers.CreateRolePermission)
		router.PATCH("/rolepermissions/:id", controllers.UpdateRolePermission)
		router.DELETE("/rolepermissions/:id", controllers.DeleteRolePermission)

		// -------- Games --------
		router.POST("/new-game", controllers.CreateGame)
		router.GET("/game", controllers.FindGames)
		router.PUT("/update-game/:id", controllers.UpdateGamebyID)
		router.POST("/upload/game", controllers.UploadGame)

		// -------- Threads --------
		router.POST("/threads", controllers.CreateThread)
		router.GET("/threads", controllers.FindThreads)
		router.GET("/threads/:id", controllers.FindThreadByID)
		router.PUT("/threads/:id", controllers.UpdateThread)
		router.DELETE("/threads/:id", controllers.DeleteThreadByID)

		// -------- Comments --------
		router.POST("/comments", controllers.CreateComment)
		router.GET("/comments", controllers.FindComments) // ?thread_id=&user_id=
		router.GET("/comments/:id", controllers.FindCommentByID)
		router.PUT("/comments/:id", controllers.UpdateComment)
		router.DELETE("/comments/:id", controllers.DeleteCommentByID)

		// -------- UserGames --------
		router.POST("/user-games", controllers.CreateUserGame)
		router.GET("/user-games", controllers.FindUserGames) // ?user_id=
		router.GET("/user-games/:id", controllers.FindUserGameByID)
		router.PUT("/user-games/:id", controllers.UpdateUserGame)
		router.DELETE("/user-games/:id", controllers.DeleteUserGameByID)

		// -------- Reactions --------
		router.POST("/reactions", controllers.CreateReaction)
		router.GET("/reactions", controllers.FindReactions) // ?target_type=&target_id=&user_id=
		router.GET("/reactions/:id", controllers.FindReactionByID)
		router.PUT("/reactions/:id", controllers.UpdateReaction)
		router.DELETE("/reactions/:id", controllers.DeleteReactionByID)

		// -------- Attachments --------
		router.POST("/attachments", controllers.CreateAttachment)
		router.GET("/attachments", controllers.FindAttachments) // ?target_type=&target_id=&user_id=
		router.GET("/attachments/:id", controllers.FindAttachmentByID)
		router.PUT("/attachments/:id", controllers.UpdateAttachment)
		router.DELETE("/attachments/:id", controllers.DeleteAttachmentByID)

		// -------- Notifications --------
		router.POST("/notifications", controllers.CreateNotification)
		router.GET("/notifications", controllers.FindNotifications) // ?user_id=
		router.GET("/notifications/:id", controllers.FindNotificationByID)
		router.PUT("/notifications/:id", controllers.UpdateNotification)
		router.DELETE("/notifications/:id", controllers.DeleteNotificationByID)

		// -------- Promotions --------
		router.POST("/promotions", controllers.CreatePromotion)
		router.GET("/promotions", controllers.FindPromotions)
		router.GET("/promotions/:id", controllers.GetPromotionByID)
		router.PUT("/promotions/:id", controllers.UpdatePromotion)
		router.DELETE("/promotions/:id", controllers.DeletePromotion)
		router.POST("/promotions/:id/games", controllers.SetPromotionGames)
		router.GET("/promotions-active", controllers.FindActivePromotions)

		// -------- Reviews --------
		router.POST("/reviews", controllers.CreateReview)
		router.GET("/reviews", controllers.FindReviews) // ?game_id=&user_id=
		router.GET("/reviews/:id", controllers.GetReviewByID)
		router.PUT("/reviews/:id", controllers.UpdateReview)
		router.DELETE("/reviews/:id", controllers.DeleteReview)
		router.POST("/reviews/:id/toggle_like", controllers.ToggleReviewLike)
		router.GET("/games/:id/reviews", controllers.FindReviewsByGame)

		// -------- Categories --------
		router.GET("/categories", controllers.FindCategories)

		// -------- KeyGames --------
		router.POST("/keygames", controllers.CreateKeyGame)
		router.GET("/keygames", controllers.FindKeyGames)
		// router.GET("/keygames/:id", controllers.FindKeyGameByID)
		router.DELETE("/keygames/:id", controllers.DeleteKeyGame)

		// -------- MinimumSpec --------
		router.POST("/new-minimumspec", controllers.CreateMinimumSpec)
		router.GET("/minimumspec", controllers.FindMinimumSpec)

		// -------- Requests --------
		router.POST("/new-request", controllers.CreateRequest)
		router.GET("/request", controllers.FindRequest)
	}

	// -------- Routes ที่ต้อง Auth --------
	authList := r.Group("/", AuthRequired())
	{
		withUserQuery := authList.Group("/", InjectUserIDQuery())
		{
			withUserQuery.GET("/orders", controllers.FindOrders)
			withUserQuery.GET("/payments", controllers.FindPayments)
		}

		// Orders (write)
		authList.POST("/orders", controllers.CreateOrder)

		// Order Items
		authList.POST("/order-items", controllers.CreateOrderItem)
		authList.GET("/order-items", controllers.FindOrderItems)
		authList.PUT("/order-items/:id/qty", controllers.UpdateOrderItemQty)
		authList.DELETE("/order-items/:id", controllers.DeleteOrderItem)

		// Payments (write/action)
		authList.POST("/payments", controllers.CreatePayment)
		authList.PATCH("/payments/:id", controllers.UpdatePayment)
		authList.POST("/payments/:id/approve", controllers.ApprovePayment) // ตรวจ role ใน handler ตามเหมาะสม
		authList.POST("/payments/:id/reject", controllers.RejectPayment)
	}

	// 5) Run server
	r.Run("localhost:" + PORT)
}

// ---------------------- Middlewares ----------------------

// CORS แบบผ่อนคลาย (คงเดิม)
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers",
			"Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-User-ID")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// AuthRequired:
// - อ่าน user id จาก Bearer JWT (sub หรือ user_id) หรือ X-User-ID
// - เซ็ต c.Set("userID", <uint>) และ (option) c.Set("roleID", <uint>)
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		var userID uint

		// 1) ลองจาก Bearer token
		authz := c.GetHeader("Authorization")
		if strings.HasPrefix(strings.ToLower(authz), "bearer ") {
			raw := strings.TrimSpace(authz[7:])
			if raw != "" {
				secret := []byte(os.Getenv("JWT_SECRET"))
				if len(secret) == 0 {
					secret = []byte("secret") // fallback ให้ตรงกับตอน Login ถ้าคุณใช้ค่าคงที่
				}
				if token, _ := jwt.Parse(raw, func(t *jwt.Token) (interface{}, error) {
					return secret, nil
				}); token != nil && token.Valid {
					if claims, ok := token.Claims.(jwt.MapClaims); ok {
						// sub เป็น string ตาม RegisteredClaims
						if sub, ok2 := claims["sub"].(string); ok2 {
							if n, err := strconv.Atoi(sub); err == nil && n > 0 {
								userID = uint(n)
							}
						}
						if userID == 0 {
							switch v := claims["user_id"].(type) {
							case float64:
								if v > 0 {
									userID = uint(v)
								}
							case string:
								if n, err := strconv.Atoi(v); err == nil && n > 0 {
									userID = uint(n)
								}
							}
						}
					}
				}
			}
		}

		// 2) สำรอง: X-User-ID
	if userID == 0 {
			if v := c.GetHeader("X-User-ID"); v != "" {
				if n, err := strconv.Atoi(v); err == nil && n > 0 {
					userID = uint(n)
				}
			}
		}

		if userID == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		// set ลง context
		c.Set("userID", userID)

		// (option) เติม roleID — รองรับทั้ง *uint และ uint
		var u entity.User
		if err := configs.DB().Select("id, role_id").First(&u, userID).Error; err == nil {
			switch v := any(getRoleField(u)).(type) {
			case *uint:
				if v != nil {
					c.Set("roleID", *v)
				}
			case uint:
				if v > 0 {
					c.Set("roleID", v)
				}
			}
		}

		c.Next()
	}
}

// getRoleField ดึงค่า role_id ออกมา รองรับ model ที่ประกาศ role เป็น *uint หรือ uint
func getRoleField(u entity.User) interface{} {
	// ถ้ามีฟิลด์เป็น pointer:
	//   type User struct { ... RoleID *uint `gorm:"column:role_id"` ... }
	// หรือถ้าเป็นค่า:
	//   type User struct { ... RoleID uint  `gorm:"column:role_id"` ... }
	// ตรงนี้ใช้ type switch เอาตามที่คอมไพล์จริง
	return any(u.RoleID)
}

// InjectUserIDQuery: ใช้เฉพาะ GET /orders และ GET /payments
func InjectUserIDQuery() gin.HandlerFunc {
	return func(c *gin.Context) {
		fp := c.FullPath()
		if c.Request.Method == http.MethodGet && (fp == "/orders" || fp == "/payments") {
			if c.Query("user_id") == "" {
				if uid := c.GetHeader("X-User-ID"); uid != "" {
					q := c.Request.URL.Query()
					q.Set("user_id", uid)
					c.Request.URL.RawQuery = q.Encode()
				}
			}
		}
		c.Next()
	}
}
