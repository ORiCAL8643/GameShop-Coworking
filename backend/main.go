// main.go
package main

import (
	"net/http"

	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/controllers"
	"github.com/gin-gonic/gin"
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

	// 4) กลุ่มเส้นทางหลัก
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
		// (คุณมี FindGameByID/DeleteGameByID เดิมที่ถูกคอมเมนต์อยู่ เลยไม่ผูก route ตรงนี้)

		// -------- Threads --------
		router.POST("/threads", controllers.CreateThread)
		router.GET("/threads", controllers.FindThreads)
		router.GET("/threads/:id", controllers.FindThreadByID)
		router.PUT("/threads/:id", controllers.UpdateThread)
		router.DELETE("/threads/:id", controllers.DeleteThreadByID)

		// -------- Comments --------
		router.POST("/comments", controllers.CreateComment)
		router.GET("/comments", controllers.FindComments)       // ?thread_id=&user_id=
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
		// อ้างอิงชื่อฟังก์ชันชุดล่าสุดของคุณ: CreateKeyGame, FindKeyGame(list), DeleteKeyGameById
		router.POST("/keygames", controllers.CreateKeyGame)
		router.GET("/keygames", controllers.FindKeyGames)
		// ถ้าคุณมี FindKeyGameByID ให้ปลดคอมเมนต์บรรทัดล่าง:
		// router.GET("/keygames/:id", controllers.FindKeyGameByID)
		router.DELETE("/keygames/:id", controllers.DeleteKeyGame)

		// -------- MinimumSpec --------
		router.POST("/new-minimumspec", controllers.CreateMinimumSpec)
		router.GET("/minimumspec", controllers.FindMinimumSpec)

		// -------- Requests --------
		router.POST("/new-request", controllers.CreateRequest)
		router.GET("/request", controllers.FindRequest)

		// -------- Orders --------
		// ใช้ middleware InjectUserIDQuery เฉพาะ GET /orders และ GET /payments เพื่อช่วยยัด user_id ให้อัตโนมัติจาก header X-User-ID (ถ้ามี)
		withUserQuery := router.Group("/", InjectUserIDQuery())
		{
			withUserQuery.GET("/orders", controllers.FindOrders) // ใช้ ?user_id= (แนะนำให้ FE ส่งจาก useAuth.id)
			withUserQuery.GET("/payments", controllers.FindPayments)
		}
		router.POST("/orders", controllers.CreateOrder)
		// ไม่รองรับแก้ไข/ลบ order ตามโค้ดปัจจุบันที่คุณปรับไว้
		// router.PUT("/orders/:id", controllers.UpdateOrder)
		// router.DELETE("/orders/:id", controllers.DeleteOrder)

		// -------- Order Items --------
		router.POST("/order-items", controllers.CreateOrderItem)
		router.GET("/order-items", controllers.FindOrderItems)
		router.PUT("/order-items/:id/qty", controllers.UpdateOrderItemQty)
		router.DELETE("/order-items/:id", controllers.DeleteOrderItem)

		// -------- Payments --------
		// POST /payments (multipart: order_id, file)
		router.POST("/payments", controllers.CreatePayment)
		router.PATCH("/payments/:id", controllers.UpdatePayment) // 👈 เพิ่มบรรทัดนี้
		router.GET("/payments", controllers.FindPayments)
		// GET /payments จัดอยู่ในกลุ่ม withUserQuery ด้านบนแล้ว (เพื่อเติม user_id อัตโนมัติได้ ถ้าคุณเลือกส่ง header)
		// ไม่รองรับ PATCH/DELETE payment โดยตรง
		router.POST("/payments/:id/approve", controllers.ApprovePayment)
		router.POST("/payments/:id/reject", controllers.RejectPayment)

		// -------- Mods / Workshop --------
		router.GET("/mods", controllers.GetMods)
		router.GET("/mods/:id", controllers.GetModById)
		router.POST("/mods", controllers.CreateMod)
		router.PATCH("/mods/:id", controllers.UpdateMod)
		router.DELETE("/mods/:id", controllers.DeleteMod)

		router.GET("/modratings", controllers.GetModRatings)
		router.GET("/modratings/:id", controllers.GetModRatingById)
		router.POST("/modratings", controllers.CreateModRating)
		router.PATCH("/modratings/:id", controllers.UpdateModRating)
		router.DELETE("/modratings/:id", controllers.DeleteModRating)

		router.GET("/modtags", controllers.GetModTags)
		router.GET("/modtags/:id", controllers.GetModTagById)
		router.POST("/modtags", controllers.CreateModTag)
		router.PATCH("/modtags/:id", controllers.UpdateModTag)
		router.DELETE("/modtags/:id", controllers.DeleteModTag)
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

// InjectUserIDQuery:
//
// สำหรับ GET /orders และ GET /payments เท่านั้น
// - ถ้า query `user_id` มีอยู่แล้ว -> ไม่ทำอะไร
// - ถ้ายังไม่มี และ header `X-User-ID` มา -> เติม `user_id` ให้
// เหตุผล: ให้ทำงานร่วมกับ FE ที่ใช้ useAuth().id ผ่าน query ได้ทันที
func InjectUserIDQuery() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ใช้ c.FullPath() ได้เพราะ middleware นี้ถูกผูกที่ group หลังจากแม็พเส้นทางแล้ว
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
