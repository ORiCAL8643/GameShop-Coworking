// main.go
package main

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/controllers"
	"example.com/sa-gameshop/middleware"
	"github.com/gin-gonic/gin"
)

const PORT = "8088"

func main() {
	// 1) เชื่อมต่อ DB + 2) AutoMigrate + Seed
	configs.ConnectionDB()
	configs.SetupDatabase()

	r := gin.Default()
	r.Static("/uploads", "./uploads")
	r.Use(CORSMiddleware())

	// health check
	r.GET("/ping", func(c *gin.Context) { c.String(http.StatusOK, "pong") })

	// Public routes
	public := r.Group("/")
	public.POST("/login", controllers.Login)
	public.POST("/register", controllers.Register) // สมัครสมาชิกได้ตลอด

	// Protected routes
	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())
	{
		// ===== Users =====
		auth.POST("/users", middleware.RequirePermission("users.manage"), controllers.CreateUser)
		auth.GET("/users", middleware.RequirePermission("users.manage"), controllers.FindUsers)
		auth.GET("/users/:id", middleware.RequirePermission("users.manage"), controllers.FindUserByID)
		auth.PUT("/users/:id", middleware.RequirePermission("users.manage"), controllers.UpdateUser)
		auth.DELETE("/users/:id", middleware.RequirePermission("users.manage"), controllers.DeleteUserByID)
		auth.PATCH("/users/:id/role", middleware.RequirePermission("roles.manage"), controllers.UpdateUserRole)

		// ===== Roles =====
		auth.GET("/roles", middleware.RequirePermission("roles.read"), controllers.GetRoles)
		auth.GET("/roles/:id", middleware.RequirePermission("roles.read"), controllers.GetRoleById)
		auth.POST("/roles", middleware.RequirePermission("roles.manage"), controllers.CreateRole)
		auth.PATCH("/roles/:id", middleware.RequirePermission("roles.manage"), controllers.UpdateRole)
		auth.DELETE("/roles/:id", middleware.RequirePermission("roles.manage"), controllers.DeleteRole)

		// ===== Permissions =====
		auth.GET("/permissions", middleware.RequirePermission("roles.manage"), controllers.GetPermissions)
		auth.GET("/permissions/:id", middleware.RequirePermission("roles.manage"), controllers.GetPermissionById)
		auth.POST("/permissions", middleware.RequirePermission("roles.manage"), controllers.CreatePermission)
		auth.PATCH("/permissions/:id", middleware.RequirePermission("roles.manage"), controllers.UpdatePermission)
		auth.DELETE("/permissions/:id", middleware.RequirePermission("roles.manage"), controllers.DeletePermission)

		// ===== RolePermissions =====
		auth.GET("/rolepermissions", middleware.RequirePermission("roles.manage"), controllers.GetRolePermissions)
		auth.GET("/rolepermissions/:id", middleware.RequirePermission("roles.manage"), controllers.GetRolePermissionById)
		auth.POST("/rolepermissions", middleware.RequirePermission("roles.manage"), controllers.CreateRolePermission)
		auth.PATCH("/rolepermissions/:id", middleware.RequirePermission("roles.manage"), controllers.UpdateRolePermission)
		auth.DELETE("/rolepermissions/:id", middleware.RequirePermission("roles.manage"), controllers.DeleteRolePermission)

		// ===== Games =====
		auth.GET("/game", middleware.RequirePermission("games.read"), controllers.FindGames)
		auth.POST("/new-game", middleware.RequirePermission("games.manage"), controllers.CreateGame)
		auth.PUT("/update-game/:id", middleware.RequirePermission("games.manage"), controllers.UpdateGamebyID)
		auth.POST("/upload/game", middleware.RequirePermission("games.manage"), controllers.UploadGame)

		// ===== Threads =====
		auth.POST("/threads", middleware.RequirePermission("community.read"), controllers.CreateThread)
		auth.GET("/threads", middleware.RequirePermission("community.read"), controllers.FindThreads)
		auth.GET("/threads/:id", middleware.RequirePermission("community.read"), controllers.FindThreadByID)
		auth.PUT("/threads/:id", middleware.RequirePermission("community.moderate"), controllers.UpdateThread)
		auth.DELETE("/threads/:id", middleware.RequirePermission("community.moderate"), controllers.DeleteThreadByID)

		// ===== Comments =====
		auth.POST("/comments", middleware.RequirePermission("community.read"), controllers.CreateComment)
		auth.GET("/comments", middleware.RequirePermission("community.read"), controllers.FindComments)
		auth.GET("/comments/:id", middleware.RequirePermission("community.read"), controllers.FindCommentByID)
		auth.PUT("/comments/:id", middleware.RequirePermission("community.moderate"), controllers.UpdateComment)
		auth.DELETE("/comments/:id", middleware.RequirePermission("community.moderate"), controllers.DeleteCommentByID)

		// ===== UserGames =====
		auth.POST("/user-games", middleware.RequirePermission("games.manage"), controllers.CreateUserGame)
		auth.GET("/user-games", middleware.RequirePermission("games.manage"), controllers.FindUserGames)
		auth.GET("/user-games/:id", middleware.RequirePermission("games.manage"), controllers.FindUserGameByID)
		auth.PUT("/user-games/:id", middleware.RequirePermission("games.manage"), controllers.UpdateUserGame)
		auth.DELETE("/user-games/:id", middleware.RequirePermission("games.manage"), controllers.DeleteUserGameByID)

		// ===== Reactions =====
		auth.POST("/reactions", middleware.RequirePermission("community.read"), controllers.CreateReaction)
		auth.GET("/reactions", middleware.RequirePermission("community.read"), controllers.FindReactions)
		auth.GET("/reactions/:id", middleware.RequirePermission("community.read"), controllers.FindReactionByID)
		auth.PUT("/reactions/:id", middleware.RequirePermission("community.moderate"), controllers.UpdateReaction)
		auth.DELETE("/reactions/:id", middleware.RequirePermission("community.moderate"), controllers.DeleteReactionByID)

		// ===== Attachments =====
		auth.POST("/attachments", middleware.RequirePermission("community.read"), controllers.CreateAttachment)
		auth.GET("/attachments", middleware.RequirePermission("community.read"), controllers.FindAttachments)
		auth.GET("/attachments/:id", middleware.RequirePermission("community.read"), controllers.FindAttachmentByID)
		auth.PUT("/attachments/:id", middleware.RequirePermission("community.moderate"), controllers.UpdateAttachment)
		auth.DELETE("/attachments/:id", middleware.RequirePermission("community.moderate"), controllers.DeleteAttachmentByID)

		// ===== Notifications =====
		auth.POST("/notifications", middleware.RequirePermission("community.read"), controllers.CreateNotification)
		auth.GET("/notifications", middleware.RequirePermission("community.read"), controllers.FindNotifications)
		auth.GET("/notifications/:id", middleware.RequirePermission("community.read"), controllers.FindNotificationByID)
		auth.PUT("/notifications/:id", middleware.RequirePermission("community.read"), controllers.UpdateNotification)
		auth.DELETE("/notifications/:id", middleware.RequirePermission("community.read"), controllers.DeleteNotificationByID)

		// ===== Promotions =====
		auth.POST("/promotions", middleware.RequirePermission("promotions.manage"), controllers.CreatePromotion)
		auth.GET("/promotions", middleware.RequirePermission("promotions.read"), controllers.FindPromotions)
		auth.GET("/promotions/:id", middleware.RequirePermission("promotions.read"), controllers.GetPromotionByID)
		auth.PUT("/promotions/:id", middleware.RequirePermission("promotions.manage"), controllers.UpdatePromotion)
		auth.DELETE("/promotions/:id", middleware.RequirePermission("promotions.manage"), controllers.DeletePromotion)
		auth.POST("/promotions/:id/games", middleware.RequirePermission("promotions.manage"), controllers.SetPromotionGames)
		auth.GET("/promotions-active", middleware.RequirePermission("promotions.read"), controllers.FindActivePromotions)

		// ===== Reviews =====
		auth.POST("/reviews", middleware.RequirePermission("reviews.read"), controllers.CreateReview)
		auth.GET("/reviews", middleware.RequirePermission("reviews.read"), controllers.FindReviews)
		auth.GET("/reviews/:id", middleware.RequirePermission("reviews.read"), controllers.GetReviewByID)
		auth.PUT("/reviews/:id", middleware.RequirePermission("reviews.moderate"), controllers.UpdateReview)
		auth.DELETE("/reviews/:id", middleware.RequirePermission("reviews.moderate"), controllers.DeleteReview)
		auth.POST("/reviews/:id/toggle_like", middleware.RequirePermission("reviews.read"), controllers.ToggleReviewLike)
		auth.GET("/games/:id/reviews", middleware.RequirePermission("reviews.read"), controllers.FindReviewsByGame)

		// ===== Categories =====
		auth.GET("/categories", middleware.RequirePermission("games.read"), controllers.FindCategories)

		// ===== Keygame =====
		auth.GET("/keygame", middleware.RequirePermission("games.manage"), controllers.FindKeyGame)
		auth.POST("/new-keygame", middleware.RequirePermission("games.manage"), controllers.CreateKeyGame)

		// ===== MinimumSpec =====
		auth.POST("/new-minimumspec", middleware.RequirePermission("games.manage"), controllers.CreateMinimumSpec)
		auth.GET("/minimumspec", middleware.RequirePermission("games.manage"), controllers.FindMinimumSpec)

		// ===== Requests =====
		auth.POST("/new-request", middleware.RequirePermission("requests.manage"), controllers.CreateRequest)
		auth.GET("/request", middleware.RequirePermission("requests.manage"), controllers.FindRequest)

		// ===== Orders =====
		auth.POST("/orders", middleware.RequirePermission("orders.manage"), controllers.CreateOrder)
		auth.GET("/orders", middleware.RequirePermission("orders.manage"), controllers.FindOrders)
		auth.GET("/orders/:id", middleware.RequirePermission("orders.manage"), controllers.FindOrderByID)
		auth.PUT("/orders/:id", middleware.RequirePermission("orders.manage"), controllers.UpdateOrder)
		auth.DELETE("/orders/:id", middleware.RequirePermission("orders.manage"), controllers.DeleteOrder)

		// ===== Order Items =====
		auth.POST("/order-items", middleware.RequirePermission("orders.manage"), controllers.CreateOrderItem)
		auth.GET("/order-items", middleware.RequirePermission("orders.manage"), controllers.FindOrderItems)
		auth.PUT("/order-items/:id", middleware.RequirePermission("orders.manage"), controllers.UpdateOrderItem)
		auth.DELETE("/order-items/:id", middleware.RequirePermission("orders.manage"), controllers.DeleteOrderItem)

		// ===== Payments =====
		auth.POST("/payments", middleware.RequirePermission("payments.manage"), controllers.CreatePayment)
		auth.GET("/payments", middleware.RequirePermission("payments.read"), controllers.FindPayments)
		auth.PATCH("/payments/:id", middleware.RequirePermission("payments.manage"), controllers.UpdatePayment)
		auth.DELETE("/payments/:id", middleware.RequirePermission("payments.manage"), controllers.DeletePayment)
		auth.POST("/payments/:id/approve", middleware.RequirePermission("payments.manage"), controllers.ApprovePayment)
		auth.POST("/payments/:id/reject", middleware.RequirePermission("payments.manage"), controllers.RejectPayment)

		// ===== Mods =====
		auth.GET("/mods", middleware.RequirePermission("workshop.read"), controllers.GetMods)
		auth.GET("/mods/:id", middleware.RequirePermission("workshop.read"), controllers.GetModById)
		auth.POST("/mods", middleware.RequirePermission("workshop.create"), controllers.CreateMod)
		auth.PATCH("/mods/:id", middleware.RequirePermission("workshop.moderate"), controllers.UpdateMod)
		auth.DELETE("/mods/:id", middleware.RequirePermission("workshop.moderate"), controllers.DeleteMod)

		// ===== Mod Ratings =====
		auth.GET("/modratings", middleware.RequirePermission("workshop.read"), controllers.GetModRatings)
		auth.GET("/modratings/:id", middleware.RequirePermission("workshop.read"), controllers.GetModRatingById)
		auth.POST("/modratings", middleware.RequirePermission("workshop.create"), controllers.CreateModRating)
		auth.PATCH("/modratings/:id", middleware.RequirePermission("workshop.moderate"), controllers.UpdateModRating)
		auth.DELETE("/modratings/:id", middleware.RequirePermission("workshop.moderate"), controllers.DeleteModRating)

		// ===== Mod Tags =====
		auth.GET("/modtags", middleware.RequirePermission("workshop.read"), controllers.GetModTags)
		auth.GET("/modtags/:id", middleware.RequirePermission("workshop.read"), controllers.GetModTagById)
		auth.POST("/modtags", middleware.RequirePermission("workshop.moderate"), controllers.CreateModTag)
		auth.PATCH("/modtags/:id", middleware.RequirePermission("workshop.moderate"), controllers.UpdateModTag)
		auth.DELETE("/modtags/:id", middleware.RequirePermission("workshop.moderate"), controllers.DeleteModTag)
	}

	// Start server
	r.Run("localhost:" + PORT)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
