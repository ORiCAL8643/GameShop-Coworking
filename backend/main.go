package main

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/controllers"
	"example.com/sa-gameshop/middlewares"
	"github.com/gin-gonic/gin"
)

const PORT = "8088"

func main() {
	// 1) DB connect + migrate/seed
	configs.ConnectionDB()
	configs.SetupDatabase()
	configs.MigrateReportTables()

	r := gin.New()

	// 2) Static & CORS
	r.Use(gin.Logger(), gin.Recovery(), CORSMiddleware())
	r.Static("/uploads", "./uploads")

	// 3) health check
	r.GET("/ping", func(c *gin.Context) { c.String(http.StatusOK, "pong") })

	// 4) Public routes (ไม่ต้อง auth)
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

		// -------- Permissions --------
		router.GET("/permissions", controllers.GetPermissions)
		router.GET("/permissions/:id", controllers.GetPermissionById)

		// -------- RolePermissions --------
		router.GET("/rolepermissions", controllers.GetRolePermissions)
		router.GET("/rolepermissions/:id", controllers.GetRolePermissionById)

		// -------- Games --------
		router.GET("/game", controllers.FindGames)
		router.GET("/games/:id", controllers.FindGameByID)

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
		router.GET("/promotions", controllers.FindPromotions)
		router.GET("/promotions/:id", controllers.GetPromotionByID)
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

		// -------- Problem Reports --------
		router.POST("/reports", controllers.CreateReport)
		router.GET("/reports", controllers.FindReports)
		router.GET("/reports/:id", controllers.GetReportByID)
		router.PUT("/reports/:id", controllers.UpdateReport)
		router.DELETE("/reports/:id", controllers.DeleteReport)
		router.POST("/reports/:id/reply", controllers.ReplyReport)

		// -------- Requests --------
		router.POST("/new-request", controllers.CreateRequest)
		router.GET("/request", controllers.FindRequest)

		// -------- Mods (public read) --------
		router.GET("/mods", controllers.GetMods)
		router.GET("/mods/:id", controllers.GetModById)
		router.GET("/mods/:id/download", controllers.DownloadMod)

		// -------- Mod Ratings --------
		router.GET("/modratings", controllers.GetModRatings)
		router.GET("/modratings/:id", controllers.GetModRatingById)
		router.POST("/modratings", controllers.CreateModRating)
	}

	// 5) Protected routes (ใช้ middlewares.AuthRequired ตัวเดียว)
	authList := r.Group("/", middlewares.AuthRequired())
	{
		authList.GET("/me/permissions", controllers.GetMyPermissions)

		// ใส่ user_id อัตโนมัติให้ GET /orders และ GET /payments
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
		authList.POST("/payments/:id/approve", middlewares.RequireAdminPerm("admin:paymentreview"), controllers.ApprovePayment)
		authList.POST("/payments/:id/reject", middlewares.RequireAdminPerm("admin:paymentreview"), controllers.RejectPayment)

		// Roles/Permissions (admin)
		authList.POST("/roles", middlewares.RequireAdminPerm("admin:role"), controllers.CreateRole)
		authList.PATCH("/roles/:id", middlewares.RequireAdminPerm("admin:role"), controllers.UpdateRole)
		authList.DELETE("/roles/:id", middlewares.RequireAdminPerm("admin:role"), controllers.DeleteRole)

		authList.POST("/permissions", middlewares.RequireAdminPerm("admin:role"), controllers.CreatePermission)
		authList.PATCH("/permissions/:id", middlewares.RequireAdminPerm("admin:role"), controllers.UpdatePermission)
		authList.DELETE("/permissions/:id", middlewares.RequireAdminPerm("admin:role"), controllers.DeletePermission)

		authList.POST("/rolepermissions", middlewares.RequireAdminPerm("admin:role"), controllers.CreateRolePermission)
		authList.PATCH("/rolepermissions/:id", middlewares.RequireAdminPerm("admin:role"), controllers.UpdateRolePermission)
		authList.DELETE("/rolepermissions/:id", middlewares.RequireAdminPerm("admin:role"), controllers.DeleteRolePermission)

		// Games (admin)
		authList.POST("/new-game", middlewares.RequireAdminPerm("admin:game"), controllers.CreateGame)
		authList.PUT("/update-game/:id", middlewares.RequireAdminPerm("admin:game"), controllers.UpdateGamebyID)
		authList.POST("/upload/game", middlewares.RequireAdminPerm("admin:game"), controllers.UploadGame)
		authList.POST("/keygames", middlewares.RequireAdminPerm("admin:game"), controllers.CreateKeyGame)
		authList.GET("/keygames", middlewares.RequireAdminPerm("admin:game"), controllers.FindKeyGames)
		authList.DELETE("/keygames/:id", middlewares.RequireAdminPerm("admin:game"), controllers.DeleteKeyGame)
		authList.POST("/new-minimumspec", middlewares.RequireAdminPerm("admin:game"), controllers.CreateMinimumSpec)
		authList.GET("/minimumspec", middlewares.RequireAdminPerm("admin:game"), controllers.FindMinimumSpec)

		// Promotions (admin)
		authList.POST("/promotions", middlewares.RequireAdminPerm("admin:promotion"), controllers.CreatePromotion)
		authList.PUT("/promotions/:id", middlewares.RequireAdminPerm("admin:promotion"), controllers.UpdatePromotion)
		authList.DELETE("/promotions/:id", middlewares.RequireAdminPerm("admin:promotion"), controllers.DeletePromotion)
		authList.POST("/promotions/:id/games", middlewares.RequireAdminPerm("admin:promotion"), controllers.SetPromotionGames)

		// Problem Reports (admin actions)
		authList.POST("/admin/reports/:id/replies", middlewares.RequireAdminPerm("admin:page"), controllers.AdminCreateReply)
		authList.PATCH("/admin/reports/:id/resolve", middlewares.RequireAdminPerm("admin:page"), controllers.AdminResolveReport)

		// Threads (write)
		authList.POST("/threads", controllers.CreateThread)
		authList.PUT("/threads/:id", controllers.UpdateThread)
		authList.DELETE("/threads/:id", controllers.DeleteThread)
		authList.POST("/threads/:id/comments", controllers.CreateComment)
		authList.DELETE("/comments/:id", controllers.DeleteComment)
		authList.POST("/threads/:id/toggle_like", controllers.ToggleThreadLike)

		authList.GET("/orders/:id/keys", controllers.FindOrderKeys)
		authList.POST("/orders/:id/keys/:key_id/reveal", controllers.RevealOrderKey)

		// Mods (write)
		authList.POST("/mods", controllers.CreateMod)
		authList.PATCH("/mods/:id", controllers.UpdateMod)
		authList.DELETE("/mods/:id", controllers.DeleteMod)
		authList.GET("/mods/mine", controllers.GetMyMods)
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
