// main.go
package main

import (
	"example.com/sa-gameshop/configs"
	//"example.com/sa-gameshop/entity"
	"example.com/sa-gameshop/controllers"
	"example.com/sa-gameshop/middlewares"
	"github.com/gin-gonic/gin"
)

const PORT = "8088"

func main() {
	// เชื่อมต่อ DB และตั้งค่าฐานข้อมูล (migrate/seed ตามที่คุณทำไว้ใน configs.SetupDatabase)
	configs.ConnectionDB()
	configs.SetupDatabase()

	r := gin.Default()
	r.Static("/uploads", "./uploads")
	r.Use(CORSMiddleware())

	// health check ง่าย ๆ
	r.GET("/ping", func(c *gin.Context) { c.String(200, "pong") })

	router := r.Group("/")
	{
		router.POST("/login", controllers.Login)
		router.GET("/me", middlewares.Authorize(""), controllers.Me)
		// ===== Users =====
		router.POST("/users", controllers.CreateUser)
		router.GET("/users", middlewares.Authorize("users.manage"), controllers.FindUsers)
		router.GET("/users/:id", middlewares.Authorize("users.manage"), controllers.FindUserByID)
		router.PUT("/users/:id", middlewares.Authorize("users.manage"), controllers.UpdateUser)
		router.DELETE("/users/:id", middlewares.Authorize("users.manage"), controllers.DeleteUserByID)
		router.PATCH("/users/:id/role", middlewares.Authorize("users.manage"), controllers.UpdateUserRole)

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
		router.GET("/game", middlewares.Authorize("games.read"), controllers.FindGames)
		router.PUT("/update-game/:id", middlewares.Authorize("games.manage"), controllers.UpdateGamebyID)
		router.POST("/upload/game", middlewares.Authorize("games.manage"), controllers.UploadGame)
		/*router.GET("/games/:id", controllers.FindGameByID)
		router.PUT("/games/:id", controllers.UpdateGame)
		router.DELETE("/games/:id", controllers.DeleteGameByID)*/

		// ===== Threads =====
		router.POST("/threads", middlewares.Authorize("community.read"), controllers.CreateThread)
		router.GET("/threads", middlewares.Authorize("community.read"), controllers.FindThreads)
		router.GET("/threads/:id", middlewares.Authorize("community.read"), controllers.FindThreadByID)
		router.PUT("/threads/:id", middlewares.Authorize("community.moderate"), controllers.UpdateThread)
		router.DELETE("/threads/:id", middlewares.Authorize("community.moderate"), controllers.DeleteThreadByID)

		// ===== Comments =====
		router.POST("/comments", middlewares.Authorize("community.read"), controllers.CreateComment)
		router.GET("/comments", middlewares.Authorize("community.read"), controllers.FindComments)
		router.GET("/comments/:id", middlewares.Authorize("community.read"), controllers.FindCommentByID)
		router.PUT("/comments/:id", middlewares.Authorize("community.moderate"), controllers.UpdateComment)
		router.DELETE("/comments/:id", middlewares.Authorize("community.moderate"), controllers.DeleteCommentByID)

		// ===== UserGames (สิทธิ์การเป็นเจ้าของเกม) =====
		router.POST("/user-games", middlewares.Authorize("games.manage"), controllers.CreateUserGame)
		router.GET("/user-games", middlewares.Authorize("games.read"), controllers.FindUserGames)
		router.GET("/user-games/:id", middlewares.Authorize("games.read"), controllers.FindUserGameByID)
		router.PUT("/user-games/:id", middlewares.Authorize("games.manage"), controllers.UpdateUserGame)
		router.DELETE("/user-games/:id", middlewares.Authorize("games.manage"), controllers.DeleteUserGameByID)

		// ===== Reactions =====
		router.POST("/reactions", middlewares.Authorize("community.read"), controllers.CreateReaction)
		router.GET("/reactions", middlewares.Authorize("community.read"), controllers.FindReactions) // ใช้ ?target_type=&target_id=&user_id=
		router.GET("/reactions/:id", middlewares.Authorize("community.read"), controllers.FindReactionByID)
		router.PUT("/reactions/:id", middlewares.Authorize("community.moderate"), controllers.UpdateReaction)
		router.DELETE("/reactions/:id", middlewares.Authorize("community.moderate"), controllers.DeleteReactionByID)

		// ===== Attachments =====
		router.POST("/attachments", middlewares.Authorize("community.read"), controllers.CreateAttachment)
		router.GET("/attachments", middlewares.Authorize("community.read"), controllers.FindAttachments) // ใช้ ?target_type=&target_id=&user_id=
		router.GET("/attachments/:id", middlewares.Authorize("community.read"), controllers.FindAttachmentByID)
		router.PUT("/attachments/:id", middlewares.Authorize("community.moderate"), controllers.UpdateAttachment)
		router.DELETE("/attachments/:id", middlewares.Authorize("community.moderate"), controllers.DeleteAttachmentByID)

		// ===== Notifications =====
		router.POST("/notifications", middlewares.Authorize("community.read"), controllers.CreateNotification)
		router.GET("/notifications", middlewares.Authorize("community.read"), controllers.FindNotifications) // ใช้ ?user_id=
		router.GET("/notifications/:id", middlewares.Authorize("community.read"), controllers.FindNotificationByID)
		router.PUT("/notifications/:id", middlewares.Authorize("community.moderate"), controllers.UpdateNotification)
		router.DELETE("/notifications/:id", middlewares.Authorize("community.moderate"), controllers.DeleteNotificationByID)

		// ===== Promotions
		router.POST("/promotions", middlewares.Authorize("promotions.manage"), controllers.CreatePromotion)
		router.GET("/promotions", middlewares.Authorize("promotions.read"), controllers.FindPromotions)
		router.GET("/promotions/:id", middlewares.Authorize("promotions.read"), controllers.GetPromotionByID)
		router.PUT("/promotions/:id", middlewares.Authorize("promotions.manage"), controllers.UpdatePromotion)
		router.DELETE("/promotions/:id", middlewares.Authorize("promotions.manage"), controllers.DeletePromotion)
		router.POST("/promotions/:id/games", middlewares.Authorize("promotions.manage"), controllers.SetPromotionGames)
		router.GET("/promotions-active", middlewares.Authorize("promotions.read"), controllers.FindActivePromotions)

		// ===== Reviews
		router.POST("/reviews", middlewares.Authorize("reviews.read"), controllers.CreateReview)
		router.GET("/reviews", middlewares.Authorize("reviews.read"), controllers.FindReviews) // ?game_id=&user_id=
		router.GET("/reviews/:id", middlewares.Authorize("reviews.read"), controllers.GetReviewByID)
		router.PUT("/reviews/:id", middlewares.Authorize("reviews.moderate"), controllers.UpdateReview)
		router.DELETE("/reviews/:id", middlewares.Authorize("reviews.moderate"), controllers.DeleteReview)
		router.POST("/reviews/:id/toggle_like", middlewares.Authorize("reviews.read"), controllers.ToggleReviewLike)
		router.GET("/games/:id/reviews", middlewares.Authorize("reviews.read"), controllers.FindReviewsByGame)

		// categories routes
		router.GET("/categories", middlewares.Authorize("games.read"), controllers.FindCategories)

		// keygame routes
		router.GET("/keygame", middlewares.Authorize("games.read"), controllers.FindKeyGame)
		router.POST("/new-keygame", middlewares.Authorize("games.manage"), controllers.CreateKeyGame)

		//minimumspec routes
		router.POST("/new-minimumspec", middlewares.Authorize("games.manage"), controllers.CreateMinimumSpec)
		router.GET("/minimumspec", middlewares.Authorize("games.read"), controllers.FindMinimumSpec)

		//request routes
		router.POST("/new-request", middlewares.Authorize("requests.create"), controllers.CreateRequest)
		router.GET("/request", middlewares.Authorize("requests.read"), controllers.FindRequest)

		// ===== Orders =====
		router.POST("/orders", middlewares.Authorize("orders.create"), controllers.CreateOrder)
		router.GET("/orders", middlewares.Authorize("orders.manage"), controllers.FindOrders)
		router.GET("/orders/:id", middlewares.Authorize("orders.manage"), controllers.FindOrderByID)
		router.PUT("/orders/:id", middlewares.Authorize("orders.manage"), controllers.UpdateOrder)
		router.DELETE("/orders/:id", middlewares.Authorize("orders.manage"), controllers.DeleteOrder)
		// ===== Order Items =====
		router.POST("/order-items", middlewares.Authorize("orders.manage"), controllers.CreateOrderItem)
		router.GET("/order-items", middlewares.Authorize("orders.manage"), controllers.FindOrderItems)
		router.PUT("/order-items/:id", middlewares.Authorize("orders.manage"), controllers.UpdateOrderItem)
		router.DELETE("/order-items/:id", middlewares.Authorize("orders.manage"), controllers.DeleteOrderItem)

		// ===== Payments =====
		router.POST("/payments", middlewares.Authorize("payments.create"), controllers.CreatePayment)
		router.GET("/payments", middlewares.Authorize("payments.manage"), controllers.FindPayments)
		router.PATCH("/payments/:id", middlewares.Authorize("payments.manage"), controllers.UpdatePayment)
		router.DELETE("/payments/:id", middlewares.Authorize("payments.manage"), controllers.DeletePayment)
		router.POST("/payments/:id/approve", middlewares.Authorize("payments.manage"), controllers.ApprovePayment)
		router.POST("/payments/:id/reject", middlewares.Authorize("payments.manage"), controllers.RejectPayment)

		// ===== Mods =====
		router.GET("/mods", middlewares.Authorize("workshop.read"), controllers.GetMods)
		router.GET("/mods/:id", middlewares.Authorize("workshop.read"), controllers.GetModById)
		router.POST("/mods", middlewares.Authorize("workshop.create"), controllers.CreateMod)
		router.PATCH("/mods/:id", middlewares.Authorize("workshop.moderate"), controllers.UpdateMod)
		router.DELETE("/mods/:id", middlewares.Authorize("workshop.moderate"), controllers.DeleteMod)

		// ===== Mod Ratings =====
		router.GET("/modratings", middlewares.Authorize("workshop.read"), controllers.GetModRatings)
		router.GET("/modratings/:id", middlewares.Authorize("workshop.read"), controllers.GetModRatingById)
		router.POST("/modratings", middlewares.Authorize("workshop.read"), controllers.CreateModRating)
		router.PATCH("/modratings/:id", middlewares.Authorize("workshop.moderate"), controllers.UpdateModRating)
		router.DELETE("/modratings/:id", middlewares.Authorize("workshop.moderate"), controllers.DeleteModRating)

		// ===== Mod Tags =====
		router.GET("/modtags", middlewares.Authorize("workshop.read"), controllers.GetModTags)
		router.GET("/modtags/:id", middlewares.Authorize("workshop.read"), controllers.GetModTagById)
		router.POST("/modtags", middlewares.Authorize("workshop.moderate"), controllers.CreateModTag)
		router.PATCH("/modtags/:id", middlewares.Authorize("workshop.moderate"), controllers.UpdateModTag)
		router.DELETE("/modtags/:id", middlewares.Authorize("workshop.moderate"), controllers.DeleteModTag)

	}

	// Run the server
	// แก้สเปซตรง "localhost:" ให้ถูกต้อง
	r.Run("localhost:" + PORT)
}

// CORS แบบเดียวกับตัวอย่างที่แนบมา
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
