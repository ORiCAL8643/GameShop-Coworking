package main

import (
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/controllers"
	"example.com/sa-gameshop/entity"
	"example.com/sa-gameshop/middlewares"
	"example.com/sa-gameshop/services"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const PORT = "8088"

func main() {
	// 1) DB connect + migrate/seed
	configs.ConnectionDB()
	configs.SetupDatabase()
	configs.MigrateReportTables() // ✅ เพิ่มบรรทัดนี้เท่านั้น

	permService := services.NewPermService(configs.DB(), 60*time.Second)

	r := gin.New()

	// 2) Static & CORS
	r.Use(gin.Logger(), gin.Recovery(), CORSMiddleware())
	r.Static("/uploads", "./uploads")

	// 3) health check
	r.GET("/ping", func(c *gin.Context) { c.String(http.StatusOK, "pong") })
	r.GET("/me", middlewares.AuthRequired(), controllers.Me(permService))

	// 4) กลุ่มเส้นทางสาธารณะ (ไม่ต้อง auth)
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

		// -------- Games --------
		router.POST("/new-game", controllers.CreateGame)
		router.GET("/game", controllers.FindGames)
		router.GET("/games/:id", controllers.FindGameByID)
		router.PUT("/update-game/:id", controllers.UpdateGamebyID)
		router.POST("/upload/game", controllers.UploadGame) // ลงทะเบียนครั้งเดียว

		// -------- Threads (READ only = public) --------
		router.GET("/threads", controllers.FindThreads)                       // ?game_id=&q=
		router.GET("/threads/:id", controllers.FindThreadByID)                // รายละเอียดเธรด
		router.GET("/threads/:id/comments", controllers.FindCommentsByThread) // คอมเมนต์แบบแถวเดียว

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
		router.PUT("/notifications/:id/read", controllers.MarkNotificationRead)
		router.PUT("/notifications/read-all", controllers.MarkAllNotificationsRead)
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
		router.GET("/reviews", controllers.FindReviews)
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
		router.DELETE("/keygames/:id", controllers.DeleteKeyGame)

		// -------- MinimumSpec --------
		router.POST("/new-minimumspec", controllers.CreateMinimumSpec)
		router.GET("/minimumspec", controllers.FindMinimumSpec)

		// -------- Problem Reports --------
		router.POST("/reports", controllers.CreateReport)
		router.GET("/reports", controllers.FindReports)
		router.GET("/reports/:id", controllers.GetReportByID)
		router.PUT("/reports/:id", controllers.UpdateReport)
		router.DELETE("/reports/:id", controllers.DeleteReport)
		// เปลี่ยน handler ให้รองรับตาราง Reply/ReplyAttachment
		router.POST("/reports/:id/reply", controllers.ReplyReport)
		// เพิ่มเส้นทางสำหรับแอดมิน (ตอบกลับ/ปิดงาน)
		router.POST("/admin/reports/:id/replies", controllers.AdminCreateReply)
		router.PATCH("/admin/reports/:id/resolve", controllers.AdminResolveReport)

		// -------- Requests --------
		router.POST("/new-request", controllers.CreateRequest)
		router.GET("/request", controllers.FindRequest)

		// -------- Mods --------
		// READ: เปิดสาธารณะเหมือนเดิม
		router.GET("/mods", controllers.GetMods)
		router.GET("/mods/:id", controllers.GetModById)
		router.GET("/mods/:id/download", controllers.DownloadMod)

		// -------- Mod Ratings --------
		router.GET("/modratings", controllers.GetModRatings)
		router.GET("/modratings/:id", controllers.GetModRatingById)
		router.POST("/modratings", controllers.CreateModRating)

		// (WRITE ย้ายไปไว้ใต้ authList ด้านล่าง)
	}

	// 5) เส้นทางที่ต้อง Auth (แนบ Bearer หรือ X-User-ID)
	authList := r.Group("/", AuthRequired())
	{
		// ฉีด user_id อัตโนมัติให้ GET /orders และ GET /payments
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
		authList.POST("/payments/:id/approve", controllers.ApprovePayment) // ตรวจ role ใน handler
		authList.POST("/payments/:id/reject", controllers.RejectPayment)

		// -------- Threads (WRITE only = ต้อง auth) --------
		authList.POST("/threads", controllers.CreateThread)    // multipart: title, content, game_id, images[]
		authList.PUT("/threads/:id", controllers.UpdateThread) // แก้ title/content
		authList.DELETE("/threads/:id", controllers.DeleteThread)
		authList.POST("/threads/:id/comments", controllers.CreateComment)
		authList.DELETE("/comments/:id", controllers.DeleteComment)
		authList.POST("/threads/:id/toggle_like", controllers.ToggleThreadLike)

		authList.GET("/orders/:id/keys", controllers.FindOrderKeys)
		authList.POST("/orders/:id/keys/:key_id/reveal", controllers.RevealOrderKey)

		// -------- Mods (WRITE only = ต้อง auth) --------
		// ✅ เพิ่มเฉพาะส่วนนี้ เพื่อบังคับให้ล็อกอินก่อนสร้าง/แก้ไข/ลบม็อด
		authList.POST("/mods", controllers.CreateMod)
		authList.PATCH("/mods/:id", controllers.UpdateMod)
		authList.DELETE("/mods/:id", controllers.DeleteMod)
		authList.GET("/mods/mine", controllers.GetMyMods)

	}

	admin := r.Group("/admin", middlewares.AuthRequired(), middlewares.RequirePerm(permService, middlewares.RequireAny, "permission.manage"))
	{
		admin.GET("/permissions", controllers.ListPermissions)
		admin.POST("/permissions", controllers.CreatePermission)
		admin.DELETE("/permissions/:id", controllers.DeletePermission)
		admin.POST("/roles/:roleId/grant", controllers.GrantPermToRole(permService))
		admin.POST("/roles/:roleId/revoke", controllers.RevokePermFromRole(permService))
		admin.GET("/roles", middlewares.RequirePerm(permService, middlewares.RequireAny, "role.read"), controllers.GetRoles)
		admin.POST("/roles", middlewares.RequirePerm(permService, middlewares.RequireAny, "role.create"), controllers.CreateRole)
		admin.PATCH("/roles/:id", middlewares.RequirePerm(permService, middlewares.RequireAny, "role.update"), controllers.UpdateRole)
		admin.DELETE("/roles/:id", middlewares.RequirePerm(permService, middlewares.RequireAny, "role.delete"), controllers.DeleteRole)
	}

	// 6) Run server
	r.Run("localhost:" + PORT)
}

// ---------------------- Middlewares ----------------------

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

// AuthRequired: อ่าน user id จาก Bearer JWT (sub/user_id) หรือ X-User-ID
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		var userID uint

		// 1) Bearer token
		authz := c.GetHeader("Authorization")
		if strings.HasPrefix(strings.ToLower(authz), "bearer ") {
			raw := strings.TrimSpace(authz[7:])
			if raw != "" {
				secret := []byte(os.Getenv("JWT_SECRET"))
				if len(secret) == 0 {
					secret = []byte("secret")
				}
				if token, _ := jwt.Parse(raw, func(t *jwt.Token) (interface{}, error) {
					return secret, nil
				}); token != nil && token.Valid {
					if claims, ok := token.Claims.(jwt.MapClaims); ok {
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

		// set context
		c.Set("userID", userID)

		// เติม roleID (รองรับทั้ง *uint และ uint)
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

// รองรับ role_id ที่อาจประกาศเป็น pointer หรือไม่เป็น
func getRoleField(u entity.User) interface{} { return any(u.RoleID) }

// InjectUserIDQuery: ใส่ user_id ลง query ให้ /orders และ /payments (เฉพาะ GET)
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
