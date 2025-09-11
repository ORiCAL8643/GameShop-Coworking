package main

import (
	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/controllers"
	"example.com/sa-gameshop/middlewares"
	"github.com/gin-gonic/gin"
	"net/http"
)

const PORT = "8088"

func main() {
	configs.ConnectionDB()
	configs.SetupDatabase()
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), CORSMiddleware())

	// static uploads
	// static สำหรับไฟล์อัปโหลด
	r.Static("/uploads", "./uploads")

	// health check
	r.GET("/ping", func(c *gin.Context) { c.String(200, "pong") })

	// กลุ่มหลัก
	router := r.Group("/")
	{
		router.POST("/login", controllers.Login)
		router.GET("/me", controllers.Me)
		// ===== Users =====
		router.POST("/users", controllers.CreateUser)
		router.GET("/users", controllers.FindUsers)
		router.GET("/users/:id", controllers.FindUserByID)
		router.PUT("/users/:id", controllers.UpdateUser)
		router.DELETE("/users/:id", controllers.DeleteUserByID)
		router.PATCH("/users/:id/role", controllers.UpdateUserRole)

		// ===== Roles =====
		router.GET("/roles", middlewares.Authorize("roles.manage"), controllers.GetRoles)
		router.GET("/roles/:id", middlewares.Authorize("roles.manage"), controllers.GetRoleById)
		router.POST("/roles", middlewares.Authorize("roles.manage"), controllers.CreateRole)
		router.PATCH("/roles/:id", middlewares.Authorize("roles.manage"), controllers.UpdateRole)
		router.DELETE("/roles/:id", middlewares.Authorize("roles.manage"), controllers.DeleteRole)

		// ===== Permissions =====
		router.GET("/permissions", middlewares.Authorize("roles.manage"), controllers.GetPermissions)
		router.GET("/permissions/:id", middlewares.Authorize("roles.manage"), controllers.GetPermissionById)
		router.POST("/permissions", middlewares.Authorize("roles.manage"), controllers.CreatePermission)
		router.PATCH("/permissions/:id", middlewares.Authorize("roles.manage"), controllers.UpdatePermission)
		router.DELETE("/permissions/:id", middlewares.Authorize("roles.manage"), controllers.DeletePermission)

		// ===== RolePermissions =====
		router.GET("/rolepermissions", middlewares.Authorize("roles.manage"), controllers.GetRolePermissions)
		router.GET("/rolepermissions/:id", middlewares.Authorize("roles.manage"), controllers.GetRolePermissionById)
		router.POST("/rolepermissions", middlewares.Authorize("roles.manage"), controllers.CreateRolePermission)
		router.PATCH("/rolepermissions/:id", middlewares.Authorize("roles.manage"), controllers.UpdateRolePermission)
		router.DELETE("/rolepermissions/:id", middlewares.Authorize("roles.manage"), controllers.DeleteRolePermission)

		// ===== Games =====
		router.POST("/new-game", middlewares.Authorize("games.manage"), controllers.CreateGame)
		router.POST("/games", middlewares.Authorize("games.manage"), controllers.CreateGame)
		router.GET("/games", controllers.FindGames)
		router.GET("/game", controllers.FindGames)
		router.PUT("/update-game/:id", middlewares.Authorize("games.manage"), controllers.UpdateGamebyID)
		router.POST("/upload/game", middlewares.Authorize("games.manage"), controllers.UploadGame)
		/*router.GET("/games/:id", controllers.FindGameByID)
		router.PUT("/games/:id", controllers.UpdateGame)
		router.DELETE("/games/:id", controllers.DeleteGameByID)*/

		// ===== Threads =====
		router.POST("/threads", middlewares.Authorize("community.moderate"), controllers.CreateThread)
		router.GET("/threads", middlewares.Authorize("community.read"), controllers.FindThreads)
		router.GET("/threads/:id", controllers.FindThreadByID)
		router.PUT("/threads/:id", middlewares.Authorize("community.moderate"), controllers.UpdateThread)
		router.DELETE("/threads/:id", middlewares.Authorize("community.moderate"), controllers.DeleteThreadByID)
		// ===== Comments =====
		router.POST("/comments", middlewares.Authorize("community.read"), controllers.CreateComment)
		router.GET("/comments", middlewares.Authorize("community.read"), controllers.FindComments)
		router.GET("/comments/:id", middlewares.Authorize("community.read"), controllers.FindCommentByID)
		router.PUT("/comments/:id", middlewares.Authorize("community.read"), controllers.UpdateComment)
		router.DELETE("/comments/:id", middlewares.Authorize("community.read"), controllers.DeleteCommentByID)
		// ===== UserGames =====
		router.POST("/user-games", middlewares.Authorize("workshop.create"), controllers.CreateUserGame)
		router.GET("/user-games", middlewares.Authorize("workshop.read"), controllers.FindUserGames)
		router.GET("/user-games/:id", controllers.FindUserGameByID)
		router.PUT("/user-games/:id", middlewares.Authorize("workshop.create"), controllers.UpdateUserGame)
		router.DELETE("/user-games/:id", middlewares.Authorize("workshop.create"), controllers.DeleteUserGameByID)
		// ===== Reactions =====
		router.POST("/reactions", controllers.CreateReaction)
		router.GET("/reactions", controllers.FindReactions)
		router.GET("/reactions/:id", controllers.FindReactionByID)
		router.PUT("/reactions/:id", controllers.UpdateReaction)
		router.DELETE("/reactions/:id", controllers.DeleteReactionByID)
		// ===== Attachments =====
		router.POST("/attachments", controllers.CreateAttachment)
		router.GET("/attachments", controllers.FindAttachments)
		router.GET("/attachments/:id", controllers.FindAttachmentByID)
		router.PUT("/attachments/:id", controllers.UpdateAttachment)
		router.DELETE("/attachments/:id", controllers.DeleteAttachmentByID)

		// ===== Notifications ===== (ย้ายมาไว้ใน group เดียวกัน)
		// ===== Notifications =====
		router.POST("/notifications", middlewares.Authorize("notifications.manage"), controllers.CreateNotification)
		router.GET("/notifications", middlewares.Authorize("notifications.read"), controllers.FindNotifications)
		router.GET("/notifications/:id", middlewares.Authorize("notifications.read"), controllers.FindNotificationByID)
		router.PUT("/notifications/:id/read", middlewares.Authorize("notifications.manage"), controllers.MarkNotificationRead)
		router.PUT("/notifications/read-all", middlewares.Authorize("notifications.manage"), controllers.MarkAllNotificationsRead)
		router.DELETE("/notifications/:id", middlewares.Authorize("notifications.manage"), controllers.DeleteNotificationByID)
		// ===== Promotions =====
		router.POST("/promotions", middlewares.Authorize("promotions.manage"), controllers.CreatePromotion)
		router.GET("/promotions", middlewares.Authorize("promotions.read"), controllers.FindPromotions)
		router.GET("/promotions/:id", middlewares.Authorize("promotions.read"), controllers.GetPromotionByID)
		router.PUT("/promotions/:id", middlewares.Authorize("promotions.manage"), controllers.UpdatePromotion)
		router.DELETE("/promotions/:id", middlewares.Authorize("promotions.manage"), controllers.DeletePromotion)
		router.POST("/promotions/:id/games", middlewares.Authorize("promotions.manage"), controllers.SetPromotionGames)
		router.GET("/promotions-active", controllers.FindActivePromotions)
		// ===== Reviews =====
		router.POST("/reviews", controllers.CreateReview)
		router.GET("/reviews", controllers.FindReviews)
		router.GET("/reviews/:id", controllers.GetReviewByID)
		router.PUT("/reviews/:id", controllers.UpdateReview)
		router.DELETE("/reviews/:id", controllers.DeleteReview)
		router.POST("/reviews/:id/toggle_like", controllers.ToggleReviewLike)
		router.GET("/games/:id/reviews", controllers.FindReviewsByGame)
		// ===== Categories / KeyGame / MinimumSpec =====
		router.GET("/categories", controllers.FindCategories)
		router.GET("/keygame", controllers.FindKeyGame)
		router.POST("/new-keygame", controllers.CreateKeyGame)
		router.POST("/new-minimumspec", controllers.CreateMinimumSpec)
		router.GET("/minimumspec", controllers.FindMinimumSpec)

		//request routes
		router.POST("/new-request", middlewares.Authorize("requests.create"), controllers.CreateRequest)
		router.GET("/request", middlewares.Authorize("requests.read"), controllers.FindRequest)

		// ===== Orders =====
		router.POST("/orders", middlewares.Authorize("refunds.manage"), controllers.CreateOrder)
		router.GET("/orders", middlewares.Authorize("refunds.read"), controllers.FindOrders)
		router.GET("/orders/:id", middlewares.Authorize("refunds.read"), controllers.FindOrderByID)
		router.PUT("/orders/:id", middlewares.Authorize("refunds.manage"), controllers.UpdateOrder)
		router.DELETE("/orders/:id", middlewares.Authorize("refunds.manage"), controllers.DeleteOrder)
		// ===== Order Items =====
		router.POST("/order-items", controllers.CreateOrderItem)
		router.GET("/order-items", controllers.FindOrderItems)
		router.PUT("/order-items/:id", controllers.UpdateOrderItem)
		router.DELETE("/order-items/:id", controllers.DeleteOrderItem)

		// ===== Payments =====
		router.POST("/payments", middlewares.Authorize("payments.create"), controllers.CreatePayment)
		router.GET("/payments", middlewares.Authorize("payments.create"), controllers.FindPayments)
		router.PATCH("/payments/:id", middlewares.Authorize("payments.manage"), controllers.UpdatePayment)
		router.DELETE("/payments/:id", middlewares.Authorize("payments.manage"), controllers.DeletePayment)
		router.POST("/payments/:id/approve", middlewares.Authorize("payments.manage"), controllers.ApprovePayment)
		router.POST("/payments/:id/reject", middlewares.Authorize("payments.manage"), controllers.RejectPayment)

		// ===== Mods =====
		router.GET("/mods", middlewares.Authorize("workshop.read"), controllers.GetMods)
		router.GET("/mods/:id", middlewares.Authorize("workshop.read"), controllers.GetModById)
		router.POST("/mods", middlewares.Authorize("workshop.create"), controllers.CreateMod)
		router.PATCH("/mods/:id", middlewares.Authorize("workshop.create"), controllers.UpdateMod)
		router.DELETE("/mods/:id", middlewares.Authorize("workshop.create"), controllers.DeleteMod)

		// ===== Mod Ratings =====
		router.GET("/modratings", controllers.GetModRatings)
		router.GET("/modratings/:id", controllers.GetModRatingById)
		router.POST("/modratings", controllers.CreateModRating)
		router.PATCH("/modratings/:id", controllers.UpdateModRating)
		router.DELETE("/modratings/:id", controllers.DeleteModRating)

		// ===== Mod Tags =====
		router.GET("/modtags", controllers.GetModTags)
		router.GET("/modtags/:id", controllers.GetModTagById)
		router.POST("/modtags", controllers.CreateModTag)
		router.PATCH("/modtags/:id", controllers.UpdateModTag)
		router.DELETE("/modtags/:id", controllers.DeleteModTag)

		// ===== Problem Reports =====
		router.POST("/reports", controllers.CreateReport)
		router.GET("/reports", middlewares.Authorize("reports.manage"), controllers.FindReports)
		router.GET("/reports/:id", middlewares.Authorize("reports.manage"), controllers.GetReportByID)
		router.PUT("/reports/:id", middlewares.Authorize("reports.manage"), controllers.UpdateReport)
		router.DELETE("/reports/:id", middlewares.Authorize("reports.manage"), controllers.DeleteReport)
		router.POST("/reports/:id/reply", middlewares.Authorize("reports.manage"), controllers.ReplyReport)
	}

	// Run the server
	// แก้สเปซตรง "localhost:" ให้ถูกต้อง
	r.Run("localhost:" + PORT)
}

// CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		// อนุญาตเฉพาะ origin ที่ใช้จริงตอน dev
		allowed := map[string]bool{
			"http://localhost:5173": true,
			"http://127.0.0.1:5173": true,
		}
		if allowed[origin] {
			c.Header("Access-Control-Allow-Origin", origin) // ห้ามใช้ "*"
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers",
				"Authorization, Content-Type, Accept, X-CSRF-Token, Origin, Cache-Control, X-Requested-With")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
