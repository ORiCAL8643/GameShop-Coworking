// main.go
package main

import (
	"example.com/sa-gameshop/configs"
	//"example.com/sa-gameshop/entity"
	"example.com/sa-gameshop/controllers"
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
		// ===== Users =====
		router.POST("/users", controllers.CreateUser)
		router.GET("/users", controllers.FindUsers)
		router.GET("/users/:id", controllers.FindUserByID)
		router.PUT("/users/:id", controllers.UpdateUser)
		router.DELETE("/users/:id", controllers.DeleteUserByID)
		router.PATCH("/users/:id/role", controllers.UpdateUserRole)

		// ===== Roles =====
		router.GET("/roles", controllers.GetRoles)
		router.GET("/roles/:id", controllers.GetRoleById)
		router.POST("/roles", controllers.CreateRole)
		router.PATCH("/roles/:id", controllers.UpdateRole)
		router.DELETE("/roles/:id", controllers.DeleteRole)

		// ===== Permissions =====
		router.GET("/permissions", controllers.GetPermissions)
		router.GET("/permissions/:id", controllers.GetPermissionById)
		router.POST("/permissions", controllers.CreatePermission)
		router.PATCH("/permissions/:id", controllers.UpdatePermission)
		router.DELETE("/permissions/:id", controllers.DeletePermission)

		// ===== RolePermissions =====
		router.GET("/rolepermissions", controllers.GetRolePermissions)
		router.GET("/rolepermissions/:id", controllers.GetRolePermissionById)
		router.POST("/rolepermissions", controllers.CreateRolePermission)
		router.PATCH("/rolepermissions/:id", controllers.UpdateRolePermission)
		router.DELETE("/rolepermissions/:id", controllers.DeleteRolePermission)

		// ===== Games =====
		router.POST("/new-game", controllers.CreateGame)
		router.GET("/game", controllers.FindGames)
		router.PUT("/update-game/:id", controllers.UpdateGamebyID)
		router.POST("/upload/game", controllers.UploadGame)
		/*router.GET("/games/:id", controllers.FindGameByID)
		router.PUT("/games/:id", controllers.UpdateGame)
		router.DELETE("/games/:id", controllers.DeleteGameByID)*/

		// ===== Threads =====
		router.POST("/threads", controllers.CreateThread)
		router.GET("/threads", controllers.FindThreads)
		router.GET("/threads/:id", controllers.FindThreadByID)
		router.PUT("/threads/:id", controllers.UpdateThread)
		router.DELETE("/threads/:id", controllers.DeleteThreadByID)

		// ===== Comments =====
		router.POST("/comments", controllers.CreateComment)
		router.GET("/comments", controllers.FindComments)
		router.GET("/comments/:id", controllers.FindCommentByID)
		router.PUT("/comments/:id", controllers.UpdateComment)
		router.DELETE("/comments/:id", controllers.DeleteCommentByID)

		// ===== UserGames (สิทธิ์การเป็นเจ้าของเกม) =====
		router.POST("/user-games", controllers.CreateUserGame)
		router.GET("/user-games", controllers.FindUserGames)
		router.GET("/user-games/:id", controllers.FindUserGameByID)
		router.PUT("/user-games/:id", controllers.UpdateUserGame)
		router.DELETE("/user-games/:id", controllers.DeleteUserGameByID)

		// ===== Reactions =====
		router.POST("/reactions", controllers.CreateReaction)
		router.GET("/reactions", controllers.FindReactions) // ใช้ ?target_type=&target_id=&user_id=
		router.GET("/reactions/:id", controllers.FindReactionByID)
		router.PUT("/reactions/:id", controllers.UpdateReaction)
		router.DELETE("/reactions/:id", controllers.DeleteReactionByID)

		// ===== Attachments =====
		router.POST("/attachments", controllers.CreateAttachment)
		router.GET("/attachments", controllers.FindAttachments) // ใช้ ?target_type=&target_id=&user_id=
		router.GET("/attachments/:id", controllers.FindAttachmentByID)
		router.PUT("/attachments/:id", controllers.UpdateAttachment)
		router.DELETE("/attachments/:id", controllers.DeleteAttachmentByID)

		// ===== Notifications =====
		router.POST("/notifications", controllers.CreateNotification)
		router.GET("/notifications", controllers.FindNotifications) // ใช้ ?user_id=
		router.GET("/notifications/:id", controllers.FindNotificationByID)
		router.PUT("/notifications/:id", controllers.UpdateNotification)
		router.DELETE("/notifications/:id", controllers.DeleteNotificationByID)

		// ===== Promotions
		router.POST("/promotions", controllers.CreatePromotion)
		router.GET("/promotions", controllers.FindPromotions)
		router.GET("/promotions/:id", controllers.GetPromotionByID)
		router.PUT("/promotions/:id", controllers.UpdatePromotion)
		router.DELETE("/promotions/:id", controllers.DeletePromotion)
		router.POST("/promotions/:id/games", controllers.SetPromotionGames)
		router.GET("/promotions-active", controllers.FindActivePromotions)

		// ===== Reviews
		router.POST("/reviews", controllers.CreateReview)
		router.GET("/reviews", controllers.FindReviews) // ?game_id=&user_id=
		router.GET("/reviews/:id", controllers.GetReviewByID)
		router.PUT("/reviews/:id", controllers.UpdateReview)
		router.DELETE("/reviews/:id", controllers.DeleteReview)
		router.POST("/reviews/:id/toggle_like", controllers.ToggleReviewLike)
		router.GET("/games/:id/reviews", controllers.FindReviewsByGame)

		// categories routes
		router.GET("/categories", controllers.FindCategories)

		// ===== KeyGames =====
		router.POST("/keygames", controllers.CreateKeyGame)
		router.GET("/keygames", controllers.FindKeyGames)
		router.GET("/keygames/:id", controllers.FindKeyGameByID)
		router.DELETE("/keygames/:id", controllers.DeleteKeyGame)


		//minimumspec routes
		router.POST("/new-minimumspec", controllers.CreateMinimumSpec)
		router.GET("/minimumspec", controllers.FindMinimumSpec)

		//request routes
		router.POST("/new-request", controllers.CreateRequest)
		router.GET("/request", controllers.FindRequest)

		// ===== Orders =====
		router.POST("/orders", controllers.CreateOrder)
		router.GET("/orders", controllers.FindOrders)
		router.GET("/orders/:id", controllers.GetOrder)
		// ลบสองบรรทัดนี้ทิ้ง ถ้าไม่มีฟังก์ชันใน controller
		// router.PUT("/orders/:id", controllers.UpdateOrder)
		// router.DELETE("/orders/:id", controllers.DeleteOrder)

		// ===== Order Items =====
		router.POST("/order-items", controllers.CreateOrderItem)
		router.GET("/order-items", controllers.FindOrderItems)
		router.PUT("/order-items/:id/qty", controllers.UpdateOrderItemQty) // เปลี่ยนเส้นทาง
		router.DELETE("/order-items/:id", controllers.DeleteOrderItem)

		// ===== Payments =====
		router.POST("/payments", controllers.CreatePayment)
		router.GET("/payments", controllers.FindPayments)
		// ลบสองบรรทัดนี้ทิ้ง เพราะเราไม่รองรับแก้ไข/ลบ payment โดยตรง
		// router.PATCH("/payments/:id", controllers.UpdatePayment)
		// router.DELETE("/payments/:id", controllers.DeletePayment)
		router.POST("/payments/:id/approve", controllers.ApprovePayment)
		router.POST("/payments/:id/reject", controllers.RejectPayment)

		// ===== Mods =====
		router.GET("/mods", controllers.GetMods)
		router.GET("/mods/:id", controllers.GetModById)
		router.POST("/mods", controllers.CreateMod)
		router.PATCH("/mods/:id", controllers.UpdateMod)
		router.DELETE("/mods/:id", controllers.DeleteMod)

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

	}

	// Run the server
	// แก้สเปซตรง "localhost:" ให้ถูกต้อง
	r.Run("localhost:" + PORT)
}

// CORS แบบเดียวกับตัวอย่างที่แนบมา
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
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
