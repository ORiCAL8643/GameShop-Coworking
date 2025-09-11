package main

import (
	"example.com/sa-gameshop/configs"
	"example.com/sa-gameshop/controllers"
	"github.com/gin-gonic/gin"
)

const PORT = "8088"

func main() {
	configs.ConnectionDB()
	configs.SetupDatabase()

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), CORSMiddleware())

	// static สำหรับไฟล์อัปโหลด
	r.Static("/uploads", "./uploads")

	// health check
	r.GET("/ping", func(c *gin.Context) { c.String(200, "pong") })

	// กลุ่มหลัก
	router := r.Group("/")
	{
		router.POST("/login", controllers.Login)

		// ===== Users =====
		router.POST("/users", controllers.CreateUser)
		router.GET("/users", controllers.FindUsers)
		router.GET("/users/:id", controllers.FindUserByID)
		router.PUT("/users/:id", controllers.UpdateUser)
		router.DELETE("/users/:id", controllers.DeleteUserByID)

		// ===== Games =====
		router.POST("/new-game", controllers.CreateGame)
		router.GET("/game", controllers.FindGames)
		router.PUT("/update-game/:id", controllers.UpdateGamebyID)

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

		// ===== UserGames =====
		router.POST("/user-games", controllers.CreateUserGame)
		router.GET("/user-games", controllers.FindUserGames)
		router.GET("/user-games/:id", controllers.FindUserGameByID)
		router.PUT("/user-games/:id", controllers.UpdateUserGame)
		router.DELETE("/user-games/:id", controllers.DeleteUserGameByID)

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

		// ===== Notifications =====
		router.POST("/notifications", controllers.CreateNotification)
		router.GET("/notifications", controllers.FindNotifications)
		router.GET("/notifications/:id", controllers.FindNotificationByID)
		router.PUT("/notifications/:id/read", controllers.MarkNotificationRead)
		router.PUT("/notifications/read-all", controllers.MarkAllNotificationsRead)
		router.DELETE("/notifications/:id", controllers.DeleteNotificationByID)

		// ===== Promotions =====
		router.POST("/promotions", controllers.CreatePromotion)
		router.GET("/promotions", controllers.FindPromotions)
		router.GET("/promotions/:id", controllers.GetPromotionByID)
		router.PUT("/promotions/:id", controllers.UpdatePromotion)
		router.DELETE("/promotions/:id", controllers.DeletePromotion)
		router.POST("/promotions/:id/games", controllers.SetPromotionGames)
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

		// ===== Problem Reports =====
		router.POST("/reports", controllers.CreateReport)
		router.GET("/reports", controllers.FindReports)
		router.GET("/reports/:id", controllers.GetReportByID)
		router.PUT("/reports/:id", controllers.UpdateReport)
		router.DELETE("/reports/:id", controllers.DeleteReport)
		router.POST("/reports/:id/reply", controllers.ReplyReport)

		// ==อย่าทำอันนี้หายไม่งั้นรูปเกมไม่ขึ้น
		router.POST("/upload/game", controllers.UploadGame)

		//request
		router.POST("/new-request", controllers.CreateRequest)
		router.GET("/request", controllers.FindRequest)

	}

	r.Run("localhost:" + PORT)
}

// CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers",
			"Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
